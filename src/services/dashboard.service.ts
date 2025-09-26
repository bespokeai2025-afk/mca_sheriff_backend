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

  // ✅ Total Call Minutes month-wise
  static async getTotalCallMinutes(months: number = 6) {
    const rawResult: { month_number: number; year: number; totalMinutes: number }[] =
      await AppDataSource.query(`
      SELECT 
        EXTRACT(MONTH FROM "createdAt")::int AS month_number,
        EXTRACT(YEAR FROM "createdAt")::int AS year,
        COALESCE(SUM("duration_ms") / 1000 / 60, 0) AS "totalMinutes"
      FROM "call_output_data"
      WHERE "createdAt" >= date_trunc('month', NOW()) - INTERVAL '${months - 1} MONTH'
      GROUP BY month_number, year
      ORDER BY year, month_number
    `);

    // Always build last N months list
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

  // Number of Calls
  static async getNumberOfCalls(months: number): Promise<number> {
    const startDate = this.getLastMonths(months);
    return AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .where("call.\"createdAt\" >= :startDate", { startDate })  // <-- fix here
      .getCount();
  }

  // Leads (positive sentiment only)
  static async getLeads(months: number): Promise<number> {
    const startDate = this.getLastMonths(months);
    return AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .where("call.\"createdAt\" >= :startDate", { startDate })  // <-- fix here
      .andWhere("call.sentiment_analysis = :sentiment", { sentiment: "positive" })
      .getCount();
  }

  // Call Performance
  static async getCallPerformance(months: number): Promise<
    { month: string; positive: number; neutral: number; negative: number }[]
  > {
    const startDate = this.getLastMonths(months);
    const result = await AppDataSource.query(`
      SELECT 
        TO_CHAR("createdAt", 'Mon') AS month,
        SUM(CASE WHEN sentiment_analysis = 'positive' THEN 1 ELSE 0 END) AS positive,
        SUM(CASE WHEN sentiment_analysis = 'neutral' THEN 1 ELSE 0 END) AS neutral,
        SUM(CASE WHEN sentiment_analysis = 'negative' THEN 1 ELSE 0 END) AS negative
      FROM call_output_data
      WHERE "createdAt" >= $1
      GROUP BY TO_CHAR("createdAt", 'Mon'), DATE_PART('month', "createdAt")
      ORDER BY DATE_PART('month', "createdAt")
    `, [startDate]);

    return result;
  }
}
