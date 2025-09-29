import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { Repository } from "typeorm";

interface CallFrequencyInput {
  number_count?: number;
  selected_days?: string[];
  selected_weeks?: string[];
  call_frequency_setting: string; // cron expression or frequency string
}

export class CallFrequencySettingService {
  private repo: Repository<CallFrequencySetting>;

  constructor() {
    this.repo = AppDataSource.getRepository(CallFrequencySetting);
  }

  // Create new frequency setting
  async create(data: CallFrequencyInput): Promise<CallFrequencySetting> {
    const entity = this.repo.create({
      number_count: data.number_count,
      selected_days: data.selected_days ? JSON.stringify(data.selected_days) : null,
      selected_weeks: data.selected_weeks ? JSON.stringify(data.selected_weeks) : null,
      call_frequency_setting: data.call_frequency_setting,
    });

    return await this.repo.save(entity);
  }

  // Get all active records (not deleted)
  async getAll(): Promise<CallFrequencySetting[]> {
    return await this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });
  }

  // Deactivate record
  async deactivate(id: string): Promise<boolean> {
    const result = await this.repo.update(id, { isActive: false });
    return result.affected !== 0;
  }

  // Soft delete record
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.update(id, { isDeleted: true, isActive: false });
    return result.affected !== 0;
  }

  // Reactivate record
  async activate(id: string): Promise<boolean> {
    const result = await this.repo.update(id, { isActive: true, isDeleted: false });
    return result.affected !== 0;
  }
}
