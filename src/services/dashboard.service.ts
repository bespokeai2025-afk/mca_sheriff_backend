import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";
import { Lead } from "../entities/Lead";

export class DashboardService {

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
 static async getTotalCallMinutes(months: number) {
   const today = new Date();

  // 🗓️ 1️⃣ Current period (exclude current month — use last full month)
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0); // last day of previous month
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (months - 1), 1);

  // 🗓️ 2️⃣ Previous period (months before the current period)
  const previousEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
  const previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth() - (months - 1), 1);


  const rawResult: { month_number: number; year: number; total_ms: number }[] =
    await AppDataSource.query(`
      SELECT 
        EXTRACT(MONTH FROM "updatedAt")::int AS month_number,
        EXTRACT(YEAR FROM "updatedAt")::int AS year,
        COALESCE(SUM("duration_ms"), 0) AS total_ms
      FROM "call_output_data"
      WHERE "updatedAt" >= date_trunc('month', NOW()) - INTERVAL '${months - 1} MONTH'
        AND "isActive" = TRUE
        AND "isDeleted" = FALSE
      GROUP BY month_number, year
      ORDER BY year, month_number
    `);

    // Step 2: Query previous 6 months
  // const previousRaw: { total_ms: number }[] = await AppDataSource.query(`
  //   SELECT COALESCE(SUM("duration_ms"), 0) AS total_ms
  //   FROM "call_output_data"
  //    WHERE "updatedAt" >= :previousStartDate', { previousStartDate })
  //      AND "updatedAt" <= :previousEndDate', { previousEndDate })
  //     AND "isActive" = TRUE
  //     AND "isDeleted" = FALSE
  // `);
   // 🧮 4️⃣ Query total duration for previous N months
  const previousRaw: { total_ms: number }[] = await AppDataSource.query(
    `
    SELECT COALESCE(SUM("duration_ms"), 0) AS total_ms
    FROM "call_output_data"
    WHERE "updatedAt" BETWEEN $1 AND $2
      AND "isActive" = TRUE
      AND "isDeleted" = FALSE
  `,
    [previousStartDate, previousEndDate]
  );

  const previousTotalMinutes = previousRaw[0]?.total_ms
    ? previousRaw[0].total_ms / 1000 / 60
    : 0;

  // Step 2: Build last N months list
  const monthList = this.getLastMonths(months);

  // Step 3: Map each month to totalMinutes in MM.SS format
  const chartData = monthList.map((m) => {
    const found = rawResult.find(
      (r) => r.month_number === m.month_number && r.year === m.year
    );

    if (found) {
      const totalMinutesDecimal = found.total_ms / 1000 / 60;
      const minutes = Math.floor(totalMinutesDecimal);
      const seconds = Math.round((totalMinutesDecimal - minutes) * 60);

      // Format as MM.SS (e.g., 7 min 18 sec → 7.18)
      const totalMinutesFormatted = Number(
        `${minutes}.${seconds < 10 ? '0' : ''}${seconds}`
      );

      return {
        months: m.month,
        totalMinutes: totalMinutesFormatted,
      };
    } else {
      return {
        months: m.month,
        totalMinutes: 0,
      };
    }
  });

  // Step 4: Calculate total across all months (sum of formatted minutes)
  const currentTotalMinutes  = chartData.reduce((sum, m) => sum + m.totalMinutes, 0);

  // return {
  //   total,
  //   months: chartData,
  // };
const changePercent =
  currentTotalMinutes === 0
    ? 0
    : ((currentTotalMinutes - previousTotalMinutes) / currentTotalMinutes) * 100;
const changePercentRounded = Math.round(changePercent);
  return {
    total: currentTotalMinutes,
    months: chartData,
    previousTotalMinutes,
    changePercent: changePercentRounded
  };
}

// Number of Calls month-wise with total count
static async getNumberOfCalls(months: number): Promise<{ total: number; months: { month: string; totalCalls: number }[];  previousTotalCalls: number;
  changePercent: number; }> {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

  // 2️⃣ Previous 6 months start & end dates
  const previousStartDate = new Date(today.getFullYear(), today.getMonth() - (2 * months - 1), 1);
  const previousEndDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 0); // last day of previous 6 months

  // Query database grouped by month number
  const rawResult: { month_number: number; totalCalls: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
    .addSelect('COUNT(1)::int', 'totalCalls')
    .where('call."updatedAt" >= :startDate', { startDate })
   .andWhere('call."call_status" = :status', { status: 'ended' })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .groupBy('month_number')
    .orderBy('month_number')
    .getRawMany();
    

     // 4️⃣ Query previous 6 months total calls
  const previousRaw: { totalCalls: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('COUNT(1)::int', 'totalCalls')
    .where('call."updatedAt" >= :previousStartDate', { previousStartDate })
    .andWhere('call."updatedAt" <= :previousEndDate', { previousEndDate })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .getRawMany();

  const previousTotalCalls = previousRaw[0]?.totalCalls || 0;
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
  // 7️⃣ Calculate change percentage vs previous 6 months
  const changePercent =
    totalCount === 0
      ? previousTotalCalls === 0
        ? 0
        : -100
      : ((totalCount - previousTotalCalls) / totalCount) * 100;

  return {
    total: totalCount,
    months: monthsData,
    previousTotalCalls,
    changePercent: Math.round(changePercent) // integer
  };
  // return {
  //   total: totalCount,
  //   months: monthsData
  // };
}
static async getLeads(months: number): Promise<{
  total: number;
  months: { month: string; totalLeads: number }[];
   previousTotalLeads: number;
  changePercent: number;
}> {
  const today = new Date();

  // Compute start date for the first day of N months ago
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  // End date = end of current month
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

   // Previous 6 months range
  const previousStartDate = new Date(today.getFullYear(), today.getMonth() - (2 * months - 1), 1);
  const previousEndDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 0, 23, 59, 59, 999);

  // Query database grouped by month number, counting only positive sentiment
  const rawResult: { month_number: number; totalLeads: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
    .addSelect('COUNT(1)::int', 'totalLeads')
    .where('call."updatedAt" >= :startDate AND call."updatedAt" <= :endDate', { startDate, endDate })
     .andWhere('call.sentiment_analysis IN (:...sentiments)', { sentiments: ["Positive", "Neutral"] })    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .groupBy('month_number')
    .orderBy('month_number')
    .getRawMany();

      // Query previous 6 months total leads
  const previousRaw: { totalLeads: number }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('COUNT(1)::int', 'totalLeads')
    .where('call."updatedAt" >= :previousStartDate AND call."updatedAt" <= :previousEndDate', { previousStartDate, previousEndDate })
    .andWhere('call.sentiment_analysis IN (:...sentiments)', { sentiments: ["Positive", "Neutral"] })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .getRawMany();

    const previousTotalLeads = previousRaw[0]?.totalLeads || 0;

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
  // const total = monthsData.reduce((sum, m) => sum + m.totalLeads, 0);

  // return {
  //   total,
  //   months: monthsData
  // };

    // Total leads for current 6 months
  const total = monthsData.reduce((sum, m) => sum + m.totalLeads, 0);

  // Calculate change percentage vs previous 6 months
  const changePercent =
    total === 0
      ? previousTotalLeads === 0
        ? 0
        : -100
      : ((total - previousTotalLeads) / total) * 100;

  return {
    total,
    months: monthsData,
    previousTotalLeads,
    changePercent: Math.round(changePercent) // integer
  };
}
static async getCallPerformance(months: number): Promise<{
  month: string; positive: number; neutral: number; negative: number }[]>
{
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
static async getTodayStats(months: number = 1): Promise<{
  newLeadsToday: number;
  callsToday: number;
  missedCalls: number;
  totalRequestedToday: number;
  positiveCalls: number;
  interestedLeads: number;
}> {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const leadRepo = AppDataSource.getRepository(Lead);
  const callRepo = AppDataSource.getRepository(CallOutputData);

  const [newLeadsToday, totalRequestedRaw, callsToday, missedCalls, positiveCalls, interestedLeads] =
    await Promise.all([
      leadRepo.createQueryBuilder("lead")
        .where("lead.createdAt >= :start AND lead.createdAt <= :end", { start, end })
        .getCount(),

      leadRepo.createQueryBuilder("lead")
        .select("COALESCE(SUM(lead.fundingAmount), 0)", "total")
        .where("lead.createdAt >= :start AND lead.createdAt <= :end", { start, end })
        .getRawOne(),

      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .andWhere("call.isActive = TRUE")
        .andWhere("call.isDeleted = FALSE")
        .getCount(),

      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .andWhere("call.disconnection_reason = :reason", { reason: "dial_no_answer" })
        .andWhere("call.isActive = TRUE")
        .andWhere("call.isDeleted = FALSE")
        .getCount(),

      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .andWhere("call.sentiment_analysis = :sentiment", { sentiment: "Positive" })
        .andWhere("call.isActive = TRUE")
        .andWhere("call.isDeleted = FALSE")
        .getCount(),

      leadRepo.createQueryBuilder("lead")
        .where("lead.createdAt >= :start AND lead.createdAt <= :end", { start, end })
        .andWhere("lead.status = :status", { status: "interested" })
        .getCount(),
    ]);

  return {
    newLeadsToday,
    callsToday,
    missedCalls,
    totalRequestedToday: Number(totalRequestedRaw?.total) || 0,
    positiveCalls,
    interestedLeads,
  };
}

static async callDrops(months: number): Promise<{
  monthly: { month: string; user_hangup: number; agent_hangup: number; dial_no_answer: number }[];
  total: number;
}> {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

  const rawResult: {
    month_number: number;
    year: number;
    user_hangup: string;
    agent_hangup: string;
    dial_no_answer: string;
  }[] = await AppDataSource.getRepository(CallOutputData)
    .createQueryBuilder("call")
    .select('EXTRACT(MONTH FROM call."updatedAt")::int', 'month_number')
    .addSelect('EXTRACT(YEAR FROM call."updatedAt")::int', 'year')
    .addSelect(
      `SUM(CASE WHEN call.disconnection_reason = 'user_hangup' THEN 1 ELSE 0 END)`,
      'user_hangup'
    )
    .addSelect(
      `SUM(CASE WHEN call.disconnection_reason = 'agent_hangup' THEN 1 ELSE 0 END)`,
      'agent_hangup'
    )
    .addSelect(
      `SUM(CASE WHEN call.disconnection_reason = 'dial_no_answer' THEN 1 ELSE 0 END)`,
      'dial_no_answer'
    )
    .where('call."updatedAt" >= :startDate', { startDate })
    .andWhere('call."isActive" = TRUE')
    .andWhere('call."isDeleted" = FALSE')
    .groupBy('month_number, year')
    .orderBy('year, month_number')
    .getRawMany();

  const monthList = this.getLastMonths(months);

  const monthly = monthList.map(m => {
    const found = rawResult.find(r => r.month_number === m.month_number && r.year === m.year);
    return {
      month: m.month,
      user_hangup: found ? Number(found.user_hangup) : 0,
      agent_hangup: found ? Number(found.agent_hangup) : 0,
      dial_no_answer: found ? Number(found.dial_no_answer) : 0,
    };
  });

  // ✅ Calculate sum (user_hangup + agent_hangup)
  const total = monthly.reduce((sum, m) => sum + m.user_hangup + m.agent_hangup, 0);

  return { total, monthly };
}


}
