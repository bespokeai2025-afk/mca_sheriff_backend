import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class CenterStagedCallService {

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
 static async callFilterCenterStage(months: number = 6) {
  // Step 1: Query total duration in milliseconds per month
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
        month: m.month,
        totalMinutes: totalMinutesFormatted,
      };
    } else {
      return {
        month: m.month,
        totalMinutes: 0,
      };
    }
  });

  // Step 4: Calculate total across all months (sum of formatted minutes)
  const total = chartData.reduce((sum, m) => sum + m.totalMinutes, 0);

  return {
    total,
    months: chartData,
  };
}


}
