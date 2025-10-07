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

export class LeadFilterMasterService {
    private leadFilterRepository = AppDataSource.getRepository(LeadFilterMaster);
    private leadFilterStatusRepository = AppDataSource.getRepository(LeadFilterStatus);


    //   public async getLeadFilters(
    //     pageSize: number,
    //     currentPage: number,
    //     search?: string
    //   ) {
    //     try {
    //       const whereCondition: any = { isDeleted: false };

    //       if (search) {
    //         whereCondition.filterName = ILike(`%${search}%`);
    //       }

    //       const [filters, totalItems] =
    //         await this.leadFilterRepository.findAndCount({
    //           where: whereCondition,
    //           order: { createdAt: "DESC" },
    //           skip: (currentPage - 1) * pageSize,
    //           take: pageSize,
    //         });

    //       const totalPages = Math.ceil(totalItems / pageSize);

    //       if (totalItems >= 1 && totalPages < currentPage) {
    //         return errorWithoutData("Page limit exceeded");
    //       }

    //       return successWithData("Lead filters fetched successfully!", filters, {
    //         totalItems,
    //         totalPages,
    //         currentPage,
    //         pageSize,
    //       });
    //     } catch (error) {
    //       return errorWithData("Error fetching lead filters", { error });
    //     }
    //   }


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

    const [filters, totalItems] = await this.leadFilterRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: "DESC" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    //  Fetch all LeadFilterStatus (only active + not deleted)
    const statuses = await this.leadFilterStatusRepository.find({
      where: { isDeleted: false, isActive: true },
    });

    //  Collect all new_currentstatus values (which store filter IDs)
    const selectedIds = new Set<string>();
    statuses.forEach((status) => {
      if (status.new_currentstatus?.length) {
        status.new_currentstatus.forEach((id) => selectedIds.add(id));
      }
    });

    //  Attach a "selected" flag if filter.id is in new_currentstatus
    const filtersWithSelection = filters.map((filter) => ({
      ...filter,
      selected: selectedIds.has(filter.id),
    }));

    return successWithData(
      "Lead filters fetched successfully!",
      filtersWithSelection,
      {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
      }
    );
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
            const updatedSelectedId = await this.leadFilterStatusRepository.save(filter);

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
      const { query, new_currentstatus, ...masterData } = data;

      // ✅ 1. Find the lead filter master
      const filter = await this.leadFilterRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!filter) {
        return errorWithoutData("Lead filter not found");
      }

      // ✅ 2. Update master fields (if any)
      Object.assign(filter, masterData);
      await this.leadFilterRepository.save(filter);

      // ✅ 3. Check if there’s already a status entry for this master
      let status = await this.leadFilterStatusRepository.findOne({
        where: {
          leadFilterMaster: { id: filter.id },
          isDeleted: false,
        },
      });

      // ✅ 4. If not found, create new
      if (!status) {
        status = this.leadFilterStatusRepository.create({
          leadFilterMaster: filter,
          query: query || null,
          new_currentstatus: Array.isArray(new_currentstatus)
            ? new_currentstatus
            : new_currentstatus
            ? String(new_currentstatus).split(",")
            : [],
          isActive: true,
          isDeleted: false,
        });
      } else {
        // ✅ 5. If exists, update
        status.query = query || status.query;
        status.new_currentstatus = Array.isArray(new_currentstatus)
          ? new_currentstatus
          : new_currentstatus
          ? String(new_currentstatus).split(",")
          : status.new_currentstatus;
      }

      const updatedStatus = await this.leadFilterStatusRepository.save(status);

      return successWithData("Lead filter and status updated successfully", {
        master: filter,
        status: updatedStatus,
      });
    } catch (error) {
      return errorWithData("Error updating lead filter status", { error });
    }
  }

}
