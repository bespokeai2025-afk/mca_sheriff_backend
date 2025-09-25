import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class DashboardService {

  // Helper: Get last N months array like [{ month: 'Apr', year: 2025 }, ...]
  private static getLastMonths(months: number) {
    const today = new Date();
    const monthList = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthList.push({ month: monthName, year: date.getFullYear() });
    }
    return monthList;
  }

  // Total Call Minutes month-wise
  static async getTotalCallMinutes(months: number) {
    const rawResult: { month: string; year: number; totalMinutes: number }[] = await AppDataSource.query(`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") AS month_number,
        EXTRACT(YEAR FROM "createdAt") AS year,
        TO_CHAR("createdAt", 'Mon') AS month,
        COALESCE(SUM("duration_ms") / 60000, 0) AS "totalMinutes"
      FROM "call_output_data"
      WHERE "createdAt" >= NOW() - INTERVAL '${months} MONTH'
      GROUP BY month_number, year, month
      ORDER BY year, month_number
    `);

    // Fill missing months with 0
    const monthList = this.getLastMonths(months);
    const result = monthList.map(m => {
      const found = rawResult.find(r => r.month === m.month && r.year === m.year);
      return { month: m.month, totalMinutes: found ? Number(found.totalMinutes) : 0 };
    });

    return result;
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
