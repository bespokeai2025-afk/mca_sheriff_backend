import { AppDataSource } from "../config/database";
import { Call } from "../entities/Call";
import { Lead } from "../entities/Lead";

export class DashboardService {

  private static getLastMonths(months: number) {
    const today = new Date();
    const monthList = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNumber = date.getMonth() + 1;
      const monthName = date.toLocaleString("en-US", { month: "short" });
      monthList.push({ month: monthName, month_number: monthNumber, year: date.getFullYear() });
    }
    return monthList;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TODAY / PERIOD STATS — cards at the top of the dashboard
  // ─────────────────────────────────────────────────────────────────────────
  static async getTodayStats(months: number = 1) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const leadRepo = AppDataSource.getRepository(Lead);
    const callRepo = AppDataSource.getRepository(Call);

    const [
      newLeadsToday,
      totalRequestedRaw,
      callsToday,
      missedCalls,
      positiveCalls,
      interestedLeads,
    ] = await Promise.all([
      // New leads in the period
      leadRepo.createQueryBuilder("lead")
        .where("lead.createdAt >= :start AND lead.createdAt <= :end", { start, end })
        .getCount(),

      // Total funding amount requested
      leadRepo.createQueryBuilder("lead")
        .select("COALESCE(SUM(lead.fundingAmount), 0)", "total")
        .where("lead.createdAt >= :start AND lead.createdAt <= :end", { start, end })
        .getRawOne(),

      // All calls in the period
      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .getCount(),

      // Missed calls = no_answer or busy
      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .andWhere("call.callStatus IN (:...statuses)", { statuses: ["no_answer", "busy"] })
        .getCount(),

      // Positive calls
      callRepo.createQueryBuilder("call")
        .where("call.createdAt >= :start AND call.createdAt <= :end", { start, end })
        .andWhere("call.sentiment = :sentiment", { sentiment: "positive" })
        .getCount(),

      // Interested leads
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

  // ─────────────────────────────────────────────────────────────────────────
  // TOTAL CALL MINUTES — chart
  // ─────────────────────────────────────────────────────────────────────────
  static async getTotalCallMinutes(months: number) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const previousEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
    const previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth() - (months - 1), 1);

    // Current period — grouped by month + year
    const rawResult: { month_number: number; year: number; total_ms: string }[] =
      await AppDataSource.getRepository(Call)
        .createQueryBuilder("call")
        .select('EXTRACT(MONTH FROM call."createdAt")::int', "month_number")
        .addSelect('EXTRACT(YEAR FROM call."createdAt")::int', "year")
        .addSelect('COALESCE(SUM(call."durationMs"), 0)', "total_ms")
        .where('call."createdAt" >= :startDate', { startDate })
        .andWhere("call.callStatus = :status", { status: "completed" })
        .groupBy("month_number, year")
        .orderBy("year, month_number")
        .getRawMany();

    // Previous period — single total
    const previousRaw: { total_ms: string } | undefined =
      await AppDataSource.getRepository(Call)
        .createQueryBuilder("call")
        .select('COALESCE(SUM(call."durationMs"), 0)', "total_ms")
        .where('call."createdAt" >= :previousStartDate AND call."createdAt" <= :previousEndDate', {
          previousStartDate,
          previousEndDate,
        })
        .andWhere("call.callStatus = :status", { status: "completed" })
        .getRawOne();

    const previousTotalMinutes = previousRaw
      ? Number(previousRaw.total_ms) / 1000 / 60
      : 0;

    const monthList = this.getLastMonths(months);

    const chartData = monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );
      if (found) {
        const totalMinutesDecimal = Number(found.total_ms) / 1000 / 60;
        const minutes = Math.floor(totalMinutesDecimal);
        const seconds = Math.round((totalMinutesDecimal - minutes) * 60);
        return {
          months: m.month,
          totalMinutes: Number(`${minutes}.${seconds < 10 ? "0" : ""}${seconds}`),
        };
      }
      return { months: m.month, totalMinutes: 0 };
    });

    const currentTotalMinutes = chartData.reduce((sum, m) => sum + m.totalMinutes, 0);
    const changePercent =
      currentTotalMinutes === 0
        ? 0
        : ((currentTotalMinutes - previousTotalMinutes) / currentTotalMinutes) * 100;

    return {
      total: currentTotalMinutes,
      months: chartData,
      previousTotalMinutes,
      changePercent: Math.round(changePercent),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NUMBER OF CALLS — chart
  // ─────────────────────────────────────────────────────────────────────────
  static async getNumberOfCalls(months: number) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const previousEndDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 0);
    const previousStartDate = new Date(today.getFullYear(), today.getMonth() - (2 * months - 1), 1);

    const rawResult: { month_number: number; year: number; totalCalls: string }[] =
      await AppDataSource.getRepository(Call)
        .createQueryBuilder("call")
        .select('EXTRACT(MONTH FROM call."createdAt")::int', "month_number")
        .addSelect('EXTRACT(YEAR FROM call."createdAt")::int', "year")
        .addSelect("COUNT(1)::int", "totalCalls")
        .where('call."createdAt" >= :startDate', { startDate })
        .andWhere("call.callStatus = :status", { status: "completed" })
        .groupBy("month_number, year")
        .orderBy("year, month_number")
        .getRawMany();

    const previousRaw: { totalCalls: string } | undefined =
      await AppDataSource.getRepository(Call)
        .createQueryBuilder("call")
        .select("COUNT(1)::int", "totalCalls")
        .where('call."createdAt" >= :previousStartDate AND call."createdAt" <= :previousEndDate', {
          previousStartDate,
          previousEndDate,
        })
        .andWhere("call.callStatus = :status", { status: "completed" })
        .getRawOne();

    const previousTotalCalls = Number(previousRaw?.totalCalls) || 0;

    const monthList = this.getLastMonths(months);
    const monthsData = monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );
      return { month: m.month, totalCalls: found ? Number(found.totalCalls) : 0 };
    });

    const totalCount = monthsData.reduce((sum, m) => sum + m.totalCalls, 0);
    const changePercent =
      totalCount === 0
        ? previousTotalCalls === 0 ? 0 : -100
        : ((totalCount - previousTotalCalls) / totalCount) * 100;

    return {
      total: totalCount,
      months: monthsData,
      previousTotalCalls,
      changePercent: Math.round(changePercent),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEADS CHART — new leads per month
  // ─────────────────────────────────────────────────────────────────────────
  static async getLeads(months: number) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const previousEndDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 0, 23, 59, 59, 999);
    const previousStartDate = new Date(today.getFullYear(), today.getMonth() - (2 * months - 1), 1);

    const rawResult: { month_number: number; year: number; totalLeads: string }[] =
      await AppDataSource.getRepository(Lead)
        .createQueryBuilder("lead")
        .select('EXTRACT(MONTH FROM lead."createdAt")::int', "month_number")
        .addSelect('EXTRACT(YEAR FROM lead."createdAt")::int', "year")
        .addSelect("COUNT(1)::int", "totalLeads")
        .where('lead."createdAt" >= :startDate AND lead."createdAt" <= :endDate', {
          startDate,
          endDate,
        })
        .groupBy("month_number, year")
        .orderBy("year, month_number")
        .getRawMany();

    const previousRaw: { totalLeads: string } | undefined =
      await AppDataSource.getRepository(Lead)
        .createQueryBuilder("lead")
        .select("COUNT(1)::int", "totalLeads")
        .where('lead."createdAt" >= :previousStartDate AND lead."createdAt" <= :previousEndDate', {
          previousStartDate,
          previousEndDate,
        })
        .getRawOne();

    const previousTotalLeads = Number(previousRaw?.totalLeads) || 0;

    const monthList = this.getLastMonths(months);
    const monthsData = monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );
      return { month: m.month, totalLeads: found ? Number(found.totalLeads) : 0 };
    });

    const total = monthsData.reduce((sum, m) => sum + m.totalLeads, 0);
    const changePercent =
      total === 0
        ? previousTotalLeads === 0 ? 0 : -100
        : ((total - previousTotalLeads) / total) * 100;

    return {
      total,
      months: monthsData,
      previousTotalLeads,
      changePercent: Math.round(changePercent),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CALL PERFORMANCE — positive / neutral / negative per month
  // ─────────────────────────────────────────────────────────────────────────
  static async getCallPerformance(months: number) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const rawResult: {
      month_number: number;
      year: number;
      positive: string;
      neutral: string;
      negative: string;
    }[] = await AppDataSource.getRepository(Call)
      .createQueryBuilder("call")
      .select('EXTRACT(MONTH FROM call."createdAt")::int', "month_number")
      .addSelect('EXTRACT(YEAR FROM call."createdAt")::int', "year")
      .addSelect(`SUM(CASE WHEN call.sentiment = 'positive' THEN 1 ELSE 0 END)`, "positive")
      .addSelect(`SUM(CASE WHEN call.sentiment = 'neutral'  THEN 1 ELSE 0 END)`, "neutral")
      .addSelect(`SUM(CASE WHEN call.sentiment = 'negative' THEN 1 ELSE 0 END)`, "negative")
      .where('call."createdAt" >= :startDate', { startDate })
      .groupBy("month_number, year")
      .orderBy("year, month_number")
      .getRawMany();

    const monthList = this.getLastMonths(months);
    return monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );
      return {
        month: m.month,
        positive: found ? Number(found.positive) : 0,
        neutral:  found ? Number(found.neutral)  : 0,
        negative: found ? Number(found.negative) : 0,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CALL DROPS — hangup reasons per month
  // ─────────────────────────────────────────────────────────────────────────
  static async callDrops(months: number) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const rawResult: {
      month_number: number;
      year: number;
      user_hangup: string;
      agent_hangup: string;
      dial_no_answer: string;
    }[] = await AppDataSource.getRepository(Call)
      .createQueryBuilder("call")
      .select('EXTRACT(MONTH FROM call."createdAt")::int', "month_number")
      .addSelect('EXTRACT(YEAR FROM call."createdAt")::int', "year")
      .addSelect(
        `SUM(CASE WHEN call."disconnectionReason" = 'user_hangup'    THEN 1 ELSE 0 END)`,
        "user_hangup"
      )
      .addSelect(
        `SUM(CASE WHEN call."disconnectionReason" = 'agent_hangup'   THEN 1 ELSE 0 END)`,
        "agent_hangup"
      )
      .addSelect(
        `SUM(CASE WHEN call."disconnectionReason" = 'dial_no_answer' THEN 1 ELSE 0 END)`,
        "dial_no_answer"
      )
      .where('call."createdAt" >= :startDate', { startDate })
      .groupBy("month_number, year")
      .orderBy("year, month_number")
      .getRawMany();

    const monthList = this.getLastMonths(months);
    const monthly = monthList.map((m) => {
      const found = rawResult.find(
        (r) => r.month_number === m.month_number && r.year === m.year
      );
      return {
        month:          m.month,
        user_hangup:    found ? Number(found.user_hangup)    : 0,
        agent_hangup:   found ? Number(found.agent_hangup)   : 0,
        dial_no_answer: found ? Number(found.dial_no_answer) : 0,
      };
    });

    const total = monthly.reduce((sum, m) => sum + m.user_hangup + m.agent_hangup, 0);
    return { total, monthly };
  }
}
