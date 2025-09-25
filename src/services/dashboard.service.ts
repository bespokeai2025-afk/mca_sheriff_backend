// services/dashboard.service.ts
import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class DashboardService {
  //  1. Total Calls Minutes
  static async getTotalCallMinutes(): Promise<number> {
    const result = await AppDataSource
      .getRepository(CallOutputData)
      .createQueryBuilder("cod")
      .select("SUM(cod.duration)", "totalMinutes")
      .getRawOne();

    return Number(result?.totalMinutes || 0);
  }

  //  2. Number of Calls
  static async getNumberOfCalls(): Promise<number> {
    const result = await AppDataSource
      .getRepository(CallOutputData)
      .createQueryBuilder("cod")
      .getCount();

    return result;
  }

  // 3. Leads (assuming leads are stored in CallOutputData with type = 'lead')
  static async getLeadsCount(): Promise<number> {
    const result = await AppDataSource
      .getRepository(CallOutputData)
      .createQueryBuilder("cod")
      .where("cod.type = :type", { type: "lead" }) // adjust field name if different
      .getCount();

    return result;
  }

  //  4. Call Performance (group by month with positive/neutral counts)
  static async getCallPerformance(): Promise<
    { month: string; positive: number; neutral: number }[]
  > {
    const result = await AppDataSource.query(`
      SELECT 
        TO_CHAR(cod.created_at, 'Mon') AS month,
        SUM(CASE WHEN cod.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive,
        SUM(CASE WHEN cod.sentiment = 'neutral' THEN 1 ELSE 0 END) AS neutral
      FROM call_output_data cod
      GROUP BY TO_CHAR(cod.created_at, 'Mon'), DATE_PART('month', cod.created_at)
      ORDER BY DATE_PART('month', cod.created_at)
    `);

    return result;
  }
}
