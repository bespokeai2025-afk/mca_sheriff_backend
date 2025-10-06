import {
  errorWithData,
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { LeadFilterMaster } from "../entities/LeadFilterMaster";
import { ILike } from "typeorm";

export class LeadFilterMasterService {
  private leadFilterRepository = AppDataSource.getRepository(LeadFilterMaster);


  public async getLeadFilters(
    pageSize: number,
    currentPage: number,
    search?: string
  ) {
    try {
      const whereCondition: any = { isDeleted: false };

      if (search) {
        whereCondition.filterName = ILike(`%${search}%`);
      }

      const [filters, totalItems] =
        await this.leadFilterRepository.findAndCount({
          where: whereCondition,
          order: { createdAt: "DESC" },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        });

      const totalPages = Math.ceil(totalItems / pageSize);

      if (totalItems >= 1 && totalPages < currentPage) {
        return errorWithoutData("Page limit exceeded");
      }

      return successWithData("Lead filters fetched successfully!", filters, {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
      });
    } catch (error) {
      return errorWithData("Error fetching lead filters", { error });
    }
  }


  public async getLeadFilterById(id: string) {
    try {
      const filter = await this.leadFilterRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!filter) {
        return errorWithoutData("Lead filter not found");
      }

      return successWithData("Lead filter fetched successfully!", filter);
    } catch (error) {
      return errorWithData("Error fetching lead filter", { error });
    }
  }

 
  public async createLeadFilter(data: Partial<LeadFilterMaster>) {
    try {
      const newFilter = this.leadFilterRepository.create(data);
      const savedFilter = await this.leadFilterRepository.save(newFilter);

      return successWithData(
        "Lead filter created successfully!",
        savedFilter
      );
    } catch (error) {
      return errorWithData("Error creating lead filter", { error });
    }
  }


  public async updateLeadFilter(id: string, data: Partial<LeadFilterMaster>) {
    try {
      const filter = await this.leadFilterRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!filter) {
        return errorWithoutData("Lead filter not found");
      }

      Object.assign(filter, data);
      const updatedFilter = await this.leadFilterRepository.save(filter);

      return successWithData(
        "Lead filter updated successfully!",
        updatedFilter
      );
    } catch (error) {
      return errorWithData("Error updating lead filter", { error });
    }
  }

 
  public async deleteLeadFilter(id: string) {
    try {
      const filter = await this.leadFilterRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!filter) {
        return errorWithoutData("Lead filter not found");
      }

      filter.isDeleted = true;
      await this.leadFilterRepository.save(filter);

      return successWithoutData("Lead filter deleted successfully!");
    } catch (error) {
      return errorWithData("Error deleting lead filter", { error });
    }
  }
}
