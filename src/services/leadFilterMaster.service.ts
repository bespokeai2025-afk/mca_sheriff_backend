import {
  errorWithData,
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { LeadFilterMaster } from "../entities/LeadFilterMaster";
import { LeadFilterStatus } from "../entities/LeadFilterStatus";
import { ILike } from "typeorm";
import axios from "axios";



export class LeadFilterMasterService {
  private leadFilterRepository = AppDataSource.getRepository(LeadFilterMaster);
  private leadFilterStatusRepository = AppDataSource.getRepository(LeadFilterStatus);


  // public async getLeadFilters(
  //   pageSize: number,
  //   currentPage: number,
  //   search?: string
  // ) {
  //   try {
  //     const whereCondition: any = { isDeleted: false };

  //     if (search) {
  //       whereCondition.filterName = ILike(`%${search}%`);
  //     }

  //     const [filters, totalItems] = await this.leadFilterRepository.findAndCount({
  //       where: whereCondition,
  //       order: { createdAt: "DESC" },
  //       skip: (currentPage - 1) * pageSize,
  //       take: pageSize,
  //     });

  //     const totalPages = Math.ceil(totalItems / pageSize);

  //     if (totalItems >= 1 && totalPages < currentPage) {
  //       return errorWithoutData("Page limit exceeded");
  //     }

  //     // Fetch all active, not deleted LeadFilterStatus
  //     const statuses = await this.leadFilterStatusRepository.find({
  //       where: { isDeleted: false, isActive: true },
  //     });

  //     // Collect all selected filter IDs
  //     // Collect all selected values from LeadFilterStatus
  //     const selectedIds = new Set<string>();
  //     statuses.forEach((status) => {
  //       if (status.new_currentstatus?.length) {
  //         status.new_currentstatus.forEach((id) => selectedIds.add(id.toString()));
  //       }
  //     });

  //     // Attach selected flag based on filterCode, not id
  //     const filtersWithSelection = filters.map((filter) => ({
  //       ...filter,
  //       selected: selectedIds.has(filter.filterCode), // compare with filterCode
  //     }));


  //     return successWithData(
  //       "Lead filters fetched successfully!",
  //       filtersWithSelection,
  //       {
  //         totalItems,
  //         totalPages,
  //         currentPage,
  //         pageSize,
  //       }
  //     );
  //   } catch (error) {
  //     return errorWithData("Error fetching lead filters", { error });
  //   }
  // }


  public async getLeadFilters(
    pageSize: number,
    currentPage: number,
    search?: string
  ) {
    try {
      // Call external API first to sync statuses from Dynamics
      const apiUrl = `${process.env.API_BASE_URL}/lead-filterStatus/get-status-fromMicrosoftDynamic`;
      // console.log(" Syncing from Dynamics API:", apiUrl);

      const syncResponse = await axios.get(apiUrl);
      // console.log(" Dynamics Sync Response:", syncResponse.data);

      if (!syncResponse.data?.success) {
        return errorWithoutData("Failed to sync lead statuses from Dynamics.");
      }

      // Continue existing logic to fetch LeadFilterMaster
      const whereCondition: any = { isDeleted: false };
      if (search) whereCondition.filterName = ILike(`%${search}%`);

      const [filters, totalItems] = await this.leadFilterRepository.findAndCount({
        where: whereCondition,
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });

      const totalPages = Math.ceil(totalItems / pageSize);
      if (totalItems >= 1 && totalPages < currentPage) return errorWithoutData("Page limit exceeded");

      const statuses = await this.leadFilterStatusRepository.find({
        where: { isDeleted: false, isActive: true },
      });

      const selectedIds = new Set<string>();
      statuses.forEach((status) => {
        if (status.new_currentstatus?.length) {
          status.new_currentstatus.forEach((id) => selectedIds.add(id.toString()));
        }
      });

      const filtersWithSelection = filters.map((filter) => ({
        ...filter,
        selected: selectedIds.has(filter.filterCode),
      }));

      return successWithData(
        "Lead filters fetched successfully!",
        filtersWithSelection,
        { totalItems, totalPages, currentPage, pageSize }
      );
    } catch (error) {
      console.error(" Error in getLeadFilters:", error);
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


  public async updateLeadFilterStatus(id: string, data: any) {
    try {
      const { new_currentstatus, ...masterData } = data;

      const status = await this.leadFilterStatusRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!status) {
        return errorWithoutData("Lead filter status not found");
      }

      // Normalize new_currentstatus
      const parsedStatus: string[] = Array.isArray(new_currentstatus)
        ? new_currentstatus
        : new_currentstatus
          ? String(new_currentstatus).split(",").map((s) => s.trim()).filter(Boolean)
          : [];

      // Build dynamic query (OR between selected values)
      status.query = parsedStatus.length
        ? `(${parsedStatus.map((v) => `new_currentstatus eq '${v}'`).join(" or ")})`
        : "";

      status.new_currentstatus = parsedStatus.map((v) => v.toString());
      Object.assign(status, masterData);

      const updatedStatus = await this.leadFilterStatusRepository.save(status);

      return successWithData("Lead filter status updated successfully", {
        status: updatedStatus,
      });
    } catch (error) {
      console.error("Error updating lead filter status:", error);
      return errorWithData("Error updating lead filter status", { error });
    }
  }


  public async getDataFromDynamicsQuery() {
    try {
      const filter = await this.leadFilterStatusRepository.find({
        where: { isDeleted: false },
        select: ['query','id'], // include 'id' + any other columns you want
        order: { createdAt: 'ASC' }, // get the earliest row
        //  where: { id, isDeleted: false },
      });
      if (!filter) {
        return errorWithoutData("Lead filter not found");
      }

      return successWithData("Lead filter query fetched successfully!", filter);
    } catch (error) {
      return errorWithData("Error fetching lead filter query", { error });
    }
  }
}
