import { AppDataSource } from "../config/database";
import { CallOutputData } from "../entities/CallOutputData";

export class CenterStagedCallService {

  static async callFilterCenterStage(
    from_date: string,
    to_date: string,
    from_time: string,
    to_time: string
  ) {
    // Build start/end timestamps
    const startTimestamp = new Date(`${from_date}T${from_time || "00:00:00"}`);
    const endTimestamp = new Date(`${to_date}T${to_time || "23:59:59"}`);

    // Query filtered call records
    const calls = await AppDataSource.getRepository(CallOutputData)
      .createQueryBuilder("call")
      .select([
        'call.to_number AS "to_number"',
        'call.customer_name AS "customer_name"',
        'call.call_status AS "call_status"',
        'call.disconnection_reason AS "disconnection_reason"',
      ])
      .where('call."updatedAt" BETWEEN :start AND :end', {
        start: startTimestamp,
        end: endTimestamp,
      })
      .andWhere('call."isActive" = TRUE')
      .andWhere('call."isDeleted" = FALSE')
      .orderBy('call."updatedAt"', 'ASC')
      .getRawMany();

    return calls;
  }
}
