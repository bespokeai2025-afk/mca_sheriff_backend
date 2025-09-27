import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";
import { CRMData } from "../entities/CRMData";
import { ILike } from "typeorm";

const DEFAULT_PAGE_SIZE = Number(process.env.PAGE_SIZE) || 10;

export class CenterStagedCallService {
  static async callFilterCenterStage(
    from_date: string,
    to_date: string,
    from_time: string,
    to_time: string,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ) {
    if (!from_date || !to_date) {
      throw new Error("Both from_date and to_date are required");
    }

    const startTimestamp = new Date(`${from_date}T${from_time || "00:00:00"}`);
    const endTimestamp = new Date(`${to_date}T${to_time || "23:59:59"}`);

    const query = AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .leftJoin(CRMData, "crm", "crm.id = call.crm_data_id")
      .where('call."updatedAt" BETWEEN :start AND :end', { start: startTimestamp, end: endTimestamp })
      .andWhere('call."isActive" = TRUE')
      .andWhere('call."isDeleted" = FALSE')
      .andWhere('crm."isActive" = TRUE')
      .andWhere('crm."isDeleted" = FALSE');

    const totalQuery = query.clone();
    const total = await totalQuery.getCount();

    query
      .select([
        'call.id AS call_id',
        'call."to_number" AS to_number',
        'crm.name AS customer_name',
        'call."call_status" AS call_status',
        'call.recording_url',
        'call.duration_ms',
        'call."disconnection_reason" AS disconnection_reason',
        'call."updatedAt" AS call_updatedAt'
      ])
      .orderBy('call."updatedAt"', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const calls = await query.getRawMany();

    // Replace duration_ms with MM:SS format
    const callsWithFormattedDuration = calls.map(call => {
      const ms = Number(call.duration_ms) || 0;
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return {
        ...call,
        duration_ms: `${minutes}:${seconds.toString().padStart(2, '0')}` // MM:SS
      };
    });

    return {
      data: callsWithFormattedDuration,
      totalItems: total,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
