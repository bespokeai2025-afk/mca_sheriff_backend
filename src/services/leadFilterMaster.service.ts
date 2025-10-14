// import {
//   errorWithData,
//   errorWithoutData,
//   successWithData,
//   successWithoutData,
// } from "../config/ApiResponse";
// import { AppDataSource } from "../config/database";
// import { LeadFilterMaster } from "../entities/LeadFilterMaster";
// import { LeadFilterStatus } from "../entities/LeadFilterStatus";
// import { ILike } from "typeorm";

// export class LeadFilterMasterService {
//   private leadFilterRepository = AppDataSource.getRepository(LeadFilterMaster);
//   private leadFilterStatusRepository = AppDataSource.getRepository(LeadFilterStatus);


//   //   public async getLeadFilters(
//   //     pageSize: number,
//   //     currentPage: number,
//   //     search?: string
//   //   ) {
//   //     try {
//   //       const whereCondition: any = { isDeleted: false };

//   //       if (search) {
//   //         whereCondition.filterName = ILike(`%${search}%`);
//   //       }

//   //       const [filters, totalItems] =
//   //         await this.leadFilterRepository.findAndCount({
//   //           where: whereCondition,
//   //           order: { createdAt: "DESC" },
//   //           skip: (currentPage - 1) * pageSize,
//   //           take: pageSize,
//   //         });

//   //       const totalPages = Math.ceil(totalItems / pageSize);

//   //       if (totalItems >= 1 && totalPages < currentPage) {
//   //         return errorWithoutData("Page limit exceeded");
//   //       }

//   //       return successWithData("Lead filters fetched successfully!", filters, {
//   //         totalItems,
//   //         totalPages,
//   //         currentPage,
//   //         pageSize,
//   //       });
//   //     } catch (error) {
//   //       return errorWithData("Error fetching lead filters", { error });
//   //     }
//   //   }


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

//       const [filters, totalItems] = await this.leadFilterRepository.findAndCount({
//         where: whereCondition,
//         order: { createdAt: "DESC" },
//         skip: (currentPage - 1) * pageSize,
//         take: pageSize,
//       });

//       const totalPages = Math.ceil(totalItems / pageSize);

//       if (totalItems >= 1 && totalPages < currentPage) {
//         return errorWithoutData("Page limit exceeded");
//       }

//       //  Fetch all LeadFilterStatus (only active + not deleted)
//       const statuses = await this.leadFilterStatusRepository.find({
//         where: { isDeleted: false, isActive: true },
//       });

//       //  Collect all new_currentstatus values (which store filter IDs)
//       const selectedIds = new Set<string>();
//       statuses.forEach((status) => {
//         if (status.new_currentstatus?.length) {
//           status.new_currentstatus.forEach((id) => selectedIds.add(id));
//         }
//       });

//       //  Attach a "selected" flag if filter.id is in new_currentstatus
//       const filtersWithSelection = filters.map((filter) => ({
//         ...filter,
//         selected: selectedIds.has(filter.id),
//       }));

//       return successWithData(
//         "Lead filters fetched successfully!",
//         filtersWithSelection,
//         {
//           totalItems,
//           totalPages,
//           currentPage,
//           pageSize,
//         }
//       );
//     } catch (error) {
//       return errorWithData("Error fetching lead filters", { error });
//     }
//   }




//   public async getLeadFilterById(id: string) {
//     try {
//       const filter = await this.leadFilterRepository.findOne({
//         where: { id, isDeleted: false },
//       });

//       if (!filter) {
//         return errorWithoutData("Lead filter not found");
//       }

//       return successWithData("Lead filter fetched successfully!", filter);
//     } catch (error) {
//       return errorWithData("Error fetching lead filter", { error });
//     }
//   }


//   public async createLeadFilter(data: Partial<LeadFilterMaster>) {
//     try {
//       const newFilter = this.leadFilterRepository.create(data);
//       const savedFilter = await this.leadFilterRepository.save(newFilter);

//       return successWithData(
//         "Lead filter created successfully!",
//         savedFilter
//       );
//     } catch (error) {
//       return errorWithData("Error creating lead filter", { error });
//     }
//   }


//   public async updateLeadFilter(id: string, data: Partial<LeadFilterMaster>) {
//     try {
//       const filter = await this.leadFilterRepository.findOne({
//         where: { id, isDeleted: false },
//       });

//       if (!filter) {
//         return errorWithoutData("Lead filter not found");
//       }

//       Object.assign(filter, data);
//       const updatedFilter = await this.leadFilterRepository.save(filter);
//       const updatedSelectedId = await this.leadFilterStatusRepository.save(filter);

//       return successWithData(
//         "Lead filter updated successfully!",
//         updatedFilter
//       );
//     } catch (error) {
//       return errorWithData("Error updating lead filter", { error });
//     }
//   }


//   public async deleteLeadFilter(id: string) {
//     try {
//       const filter = await this.leadFilterRepository.findOne({
//         where: { id, isDeleted: false },
//       });

//       if (!filter) {
//         return errorWithoutData("Lead filter not found");
//       }

//       filter.isDeleted = true;
//       await this.leadFilterRepository.save(filter);

//       return successWithoutData("Lead filter deleted successfully!");
//     } catch (error) {
//       return errorWithData("Error deleting lead filter", { error });
//     }
//   }
//   // public async updateLeadFilterStatus(id: string, data: any) {
//   //   try {
//   //     const { query: rawQuery, new_currentstatus, ...masterData } = data;

//   //     // 1️⃣ Find the existing LeadFilterStatus record
//   //     const status = await this.leadFilterStatusRepository.findOne({
//   //       where: { id, isDeleted: false },
//   //     });

//   //     if (!status) {
//   //       return errorWithoutData("Lead filter status not found");
//   //     }

//   //     // 2️⃣ Normalize new_currentstatus into array
//   //     const parsedStatus: string[] = Array.isArray(new_currentstatus)
//   //       ? new_currentstatus
//   //       : new_currentstatus
//   //       ? String(new_currentstatus).split(",").map((s) => s.trim()).filter(Boolean)
//   //       : [];

//   //     // 3️⃣ Update query dynamically
//   //     let query = rawQuery || status.query || "";
//   //     if (query && parsedStatus.length > 0) {
//   //       const dynamicCondition = parsedStatus.map((s) => `new_currentstatus eq ${s}`).join(" or ");
//   //       query = query.replace(/new_currentstatus\s+eq\s+[0-9']+/i, `(${dynamicCondition})`);
//   //     }

//   //     // 4️⃣ Update the status record
//   //     status.query = query;
//   //     status.new_currentstatus = parsedStatus; // ✅ assign array, not string
//   //     Object.assign(status, masterData);

//   //     // 5️⃣ Save the updated record
//   //     const updatedStatus = await this.leadFilterStatusRepository.save(status);

//   //     return successWithData("Lead filter status updated successfully", {
//   //       status: updatedStatus,
//   //     });
//   //   } catch (error) {
//   //     console.error("Error updating lead filter status:", error);
//   //     return errorWithData("Error updating lead filter status", { error });
//   //   }
//   // }
//   public async updateLeadFilterStatus(id: string, data: any) {
//     try {
//       const { query: rawQuery, new_currentstatus, ...masterData } = data;

//       // 1️⃣ Find the existing LeadFilterStatus record
//       const status = await this.leadFilterStatusRepository.findOne({
//         where: { id, isDeleted: false },
//       });

//       if (!status) {
//         return errorWithoutData("Lead filter status not found");
//       }

//       // 2️⃣ Ensure new_currentstatus is an array of strings
//       const parsedStatus: string[] = Array.isArray(new_currentstatus)
//         ? new_currentstatus
//         : new_currentstatus
//           ? String(new_currentstatus).split(",").map((s) => s.trim()).filter(Boolean)
//           : [];

//       // 3️⃣ Build dynamic query with AND for master IDs
//       let query = rawQuery || status.query || "";
//       if (query && parsedStatus.length > 0) {
//         const dynamicCondition = parsedStatus.map((id) => `new_currentstatus eq '${id}'`).join(" and ");
//         query = query.replace(/new_currentstatus\s+eq\s+[0-9']+/i, `(${dynamicCondition})`);
//       }

//       // 4️⃣ Update the status record
//       status.query = query;
//       status.new_currentstatus = parsedStatus; // ✅ assign array of IDs
//       Object.assign(status, masterData);

//       // 5️⃣ Save the updated record
//       const updatedStatus = await this.leadFilterStatusRepository.save(status);

//       return successWithData("Lead filter status updated successfully", {
//         status: updatedStatus,
//       });
//     } catch (error) {
//       console.error("Error updating lead filter status:", error);
//       return errorWithData("Error updating lead filter status", { error });
//     }
//   }



//   public async getDataFromDynamicsQuery() {
//     try {
//       const filter = await this.leadFilterStatusRepository.find({
//         where: { isDeleted: false },
//         select: ['query'], // include 'id' + any other columns you want
//         order: { createdAt: 'ASC' }, // get the earliest row
//         //  where: { id, isDeleted: false },
//       });



//       console.log("filter ", filter);
//       if (!filter) {
//         return errorWithoutData("Lead filter not found");
//       }

//       // ✅ return only the query value
//       return successWithData("Lead filter query fetched successfully!", filter);
//     } catch (error) {
//       return errorWithData("Error fetching lead filter query", { error });
//     }
//   }



// }





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

      // Fetch all active, not deleted LeadFilterStatus
      const statuses = await this.leadFilterStatusRepository.find({
        where: { isDeleted: false, isActive: true },
      });

      // Collect all selected filter IDs
      // Collect all selected values from LeadFilterStatus
      const selectedIds = new Set<string>();
      statuses.forEach((status) => {
        if (status.new_currentstatus?.length) {
          status.new_currentstatus.forEach((id) => selectedIds.add(id.toString()));
        }
      });

      // Attach selected flag based on filterCode, not id
      const filtersWithSelection = filters.map((filter) => ({
        ...filter,
        selected: selectedIds.has(filter.filterCode), // compare with filterCode
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
        select: ['query'], // include 'id' + any other columns you want
        order: { createdAt: 'ASC' }, // get earliest row
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
