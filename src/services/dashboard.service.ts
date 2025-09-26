import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class DashboardService {

  // Helper: Get last N months
  private static getLastMonths(months: number) {
    const today = new Date();
    const monthList = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNumber = date.getMonth() + 1; // 1–12
      const monthName = date.toLocaleString("en-US", { month: "short" }); // force en-US → "Sep"
      monthList.push({ month: monthName, month_number: monthNumber, year: date.getFullYear() });
    }
    return monthList;
  }

  // Total Call Minutes month-wise
  static async getTotalCallMinutes(months: number = 6) {
    // const rawResult: { month_number: number; year: number; totalMinutes: number }[] =
    //   await AppDataSource.query(`
    //   SELECT 
    //     EXTRACT(MONTH FROM "updatedAt")::int AS month_number,
    //     EXTRACT(YEAR FROM "updatedAt")::int AS year,
    //     COALESCE(SUM("duration_ms") / 1000 / 60, 0) AS "totalMinutes"
    //   FROM "call_output_data"
    //   WHERE "updatedAt" >= date_trunc('month', NOW()) - INTERVAL '${months - 1} MONTH'
    //   AND "isActive" = TRUE
    //   AND "isDeleted" = FALSE
    //   GROUP BY month_number, year
    //   ORDER BY year, month_number
    // `);

    // Always build last N months list
    const rawResult: { month_number: number; year: number; totalMinutes: number; minutes: number; seconds: number }[] =
  await AppDataSource.query(`
    SELECT 
      EXTRACT(MONTH FROM "updatedAt")::int AS month_number,
      EXTRACT(YEAR FROM "updatedAt")::int AS year,
      
      -- Total minutes in decimal
      COALESCE(SUM("duration_ms") / 1000 / 60, 0) AS "totalMinutes",

      -- Whole minutes
      FLOOR(COALESCE(SUM("duration_ms") / 1000 / 60, 0)) AS "minutes",

      -- Remaining seconds
      ROUND(COALESCE(SUM("duration_ms") / 1000, 0) % 60, 2) AS "seconds"

    FROM "call_output_data"
    WHERE "updatedAt" >= date_trunc('month', NOW()) - INTERVAL '${months - 1} MONTH'
      AND "isActive" = TRUE
      AND "isDeleted" = FALSE
    GROUP BY month_number, year
    ORDER BY year, month_number
  `);

    const monthList = this.getLastMonths(months);

    const chartData = monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );

      return {
        month: m.month,
        totalMinutes: found ? Number(Number(found.totalMinutes).toFixed(2)) : 0,
      };
    });

    const total = chartData.reduce((sum, m) => sum + m.totalMinutes, 0);

    return {
      total,
      months: chartData,
    };
  }

// Number of Calls month-wise with total count
static async getNumberOfCalls(months: number): Promise<{ total: number; months: { month: string; totalCalls: number }[] }> {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

  // Query database grouped by month number
  const rawResult: { month_number: number; totalCalls: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
    .addSelect('COUNT(1)::int', 'totalCalls')
    .where('call."updatedAt" >= :startDate', { startDate })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .groupBy('month_number')
    .orderBy('month_number')
    .getRawMany();

  // Map last N months to month names
  const monthList = this.getLastMonths(months);
  const monthsData = monthList.map(m => {
    const found = rawResult.find(r => r.month_number === m.month_number);
    return {
      month: m.month, // month name string only
      totalCalls: found ? found.totalCalls : 0
    };
  });

  // Calculate total calls
  const totalCount = monthsData.reduce((sum, m) => sum + m.totalCalls, 0);

  return {
    total: totalCount,
    months: monthsData
  };
}

// Leads (positive sentiment only) month-wise with total count
// Leads (positive sentiment only) month-wise with total count
static async getLeads(months: number): Promise<{
  total: number;
  months: { month: string; totalLeads: number }[];
}> {
  const today = new Date();

  // Compute start date for the first day of N months ago
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  // End date = end of current month
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  // Query database grouped by month number, counting only positive sentiment
  const rawResult: { month_number: number; totalLeads: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
    .addSelect('COUNT(1)::int', 'totalLeads')
    .where('call."updatedAt" >= :startDate AND call."updatedAt" <= :endDate', { startDate, endDate })
    .andWhere('call.sentiment_analysis = :sentiment', { sentiment: "Positive" })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .groupBy('month_number')
    .orderBy('month_number')
    .getRawMany();

  // Build last N months list
  const monthList = this.getLastMonths(months); // [{month, month_number, year}, ...]

  // Map results to month names, default 0 if no data
  const monthsData = monthList.map(m => {
    const found = rawResult.find(r => r.month_number === m.month_number);
    return {
      month: m.month, // month name string
      totalLeads: found ? Number(found.totalLeads) : 0
    };
  });

  // Total positive leads
  const total = monthsData.reduce((sum, m) => sum + m.totalLeads, 0);

  return {
    total,
    months: monthsData
  };
}




// Call Performance month-wise (Positive, Neutral, Negative only)
static async getCallPerformance(months: number): Promise<
  { month: string; positive: number; neutral: number; negative: number }[]
> {
  // Compute start date for query
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

  // Query DB grouped by month number
  const rawResult: { month_number: number; positive: number; neutral: number; negative: number }[] =
    await AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
      .addSelect(`SUM(CASE WHEN call.sentiment_analysis = 'Positive' THEN 1 ELSE 0 END)`, 'positive')
      .addSelect(`SUM(CASE WHEN call.sentiment_analysis = 'Neutral' THEN 1 ELSE 0 END)`, 'neutral')
      .addSelect(`SUM(CASE WHEN call.sentiment_analysis = 'Negative' THEN 1 ELSE 0 END)`, 'negative')
      .where('call."updatedAt" >= :startDate', { startDate })
      .groupBy('month_number')
      .orderBy('month_number')
      .getRawMany();

  // Map last N months to month names
  const monthList = this.getLastMonths(months);
  const result = monthList.map(m => {
    const found = rawResult.find(r => r.month_number === m.month_number);
    return {
      month: m.month, // only month name
      positive: found ? Number(found.positive) : 0,
      neutral: found ? Number(found.neutral) : 0,
      negative: found ? Number(found.negative) : 0
    };
  });

  return result;
}

}
