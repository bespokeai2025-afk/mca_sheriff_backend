import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class DashboardService {

  private static getStartDate(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }

  // Total Call Minutes
  static async getTotalCallMinutes(months: number): Promise<number> {
    const startDate = this.getStartDate(months);
    const result = await AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .select("SUM(call.duration_ms)", "totalMinutes")
      .where("call.\"createdAt\" >= :startDate", { startDate })  // <-- fix here
      .getRawOne();

    return Number(result?.totalMinutes || 0);
  }

  // Number of Calls
  static async getNumberOfCalls(months: number): Promise<number> {
    const startDate = this.getStartDate(months);
    return AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .where("call.\"createdAt\" >= :startDate", { startDate })  // <-- fix here
      .getCount();
  }

  // Leads (positive sentiment only)
  static async getLeads(months: number): Promise<number> {
    const startDate = this.getStartDate(months);
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
    const startDate = this.getStartDate(months);
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
