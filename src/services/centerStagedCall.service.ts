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
    // search?: string
  ) {
    if (!from_date || !to_date) {
      throw new Error("Both from_date and to_date are required");
    }

    //  Build start/end timestamps
    const startTimestamp = new Date(`${from_date}T${from_time || "00:00:00"}`);
    const endTimestamp = new Date(`${to_date}T${to_time || "23:59:59"}`);

    //  Base query builder
    const query = AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .leftJoin(CRMData, "crm", "crm.id = call.crm_data_id")
      .where('call."updatedAt" BETWEEN :start AND :end', { start: startTimestamp, end: endTimestamp })
      .andWhere('call."isActive" = TRUE')
      .andWhere('call."isDeleted" = FALSE')
      .andWhere('crm."isActive" = TRUE')
      .andWhere('crm."isDeleted" = FALSE');

    //  Apply search filter (case-insensitive)
    // if (search && search.trim() !== "") {
            
    //   query.andWhere(
    //     `(crm.name ILIKE :search OR call."to_number" ILIKE :search OR call."call_status" ILIKE :search)`,
    //     { search: `%${search}%` }
    //   );
    // }

    //  Get total count for pagination
    const totalQuery = query.clone();
    const total = await totalQuery.getCount();

    //  Apply select, pagination, and sorting
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

    // Log SQL and parameters for debugging
    // console.log("Generated SQL:", query.getSql());
    // console.log("Query Parameters:", query.getParameters());

    //  Execute query
    const calls = await query.getRawMany();

    //  Return paginated result
    return {
      data: calls,
      totalItems: total,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
