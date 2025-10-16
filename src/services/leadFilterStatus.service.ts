// import axios from "axios";
// import { AppDataSource } from "../config/database";
// import { LeadFilterStatus } from "../entities/LeadFilterStatus";

// interface StatusOption {
//   value: number;
//   label: string;
// }

// export class leadFilterStatus {
//   private leadFilterStatusRepository = AppDataSource.getRepository(LeadFilterStatus);

//   /**
//    * Fetch OAuth token dynamically from .env credentials
//    */
//   private async getToken(): Promise<string> {
//     const tenantId = process.env.DYNAMICS_TENANT_ID;
//     const clientId = process.env.DYNAMICS_CLIENT_ID;
//     const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
//     const scope = process.env.DYNAMICS_SCOPE;

//     const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

//     const params = new URLSearchParams();
//     params.append("grant_type", "client_credentials");
//     params.append("client_id", clientId!);
//     params.append("client_secret", clientSecret!);
//     params.append("scope", scope!);

//     try {
//       const response = await axios.post(url, params, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });
//       return response.data.access_token;
//     } catch (error: any) {
//       console.error("❌ Error fetching Dynamics token:", error.response?.data || error.message);
//       throw new Error("Failed to get OAuth token from Dynamics.");
//     }
//   }

//   /**
//    * Fetch 'new_currentstatus' picklist from Dynamics
//    */
//   async fetchFromDynamics(): Promise<StatusOption[]> {
//     const token = await this.getToken();

//     const url =
//       "https://pinnaclemanagementcorporation.crm4.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='lead')/Attributes(LogicalName='new_currentstatus')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)";

//     const response = await axios.get(url, {
//       headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//     });

//     const options = response.data?.OptionSet?.Options || [];
//     return options
//       .map((opt: any) => ({
//         value: opt?.Value,
//         label: opt?.Label?.UserLocalizedLabel?.Label,
//       }))
//       .filter((opt: StatusOption) => opt.value !== undefined && opt.label);
//   }

//   /**
//    * Save or update global new_currentstatus
//    */
//   async saveStatusesToDB(): Promise<LeadFilterStatus> {
//     const statuses = await this.fetchFromDynamics();

//     const values = statuses.map((s) => s.value.toString());
//     const labels = statuses.map((s) => s.label);

//     let existing = await this.leadFilterStatusRepository.findOne({
//       where: { query: "global new_currentstatus", isDeleted: false },
//     });

//     if (existing) {
//       existing.new_currentstatus = values;
//       existing.new_currentstatus_label = labels;
//       existing.updatedAt = new Date();
//       return this.leadFilterStatusRepository.save(existing);
//     } else {
//       const newStatus = this.leadFilterStatusRepository.create({
//         new_currentstatus: values,
//         new_currentstatus_label: labels,
//         query: "global new_currentstatus",
//       });
//       return this.leadFilterStatusRepository.save(newStatus);
//     }
//   }

//   /**
//    * Get stored global statuses
//    */
//   async getStoredStatuses(): Promise<{ value: string; label: string }[] | null> {
//     const data = await this.leadFilterStatusRepository.findOne({
//       where: { query: "global new_currentstatus", isDeleted: false },
//     });
//     if (!data?.new_currentstatus || !data?.new_currentstatus_label) return null;

//     return data.new_currentstatus.map((value, index) => ({
//       value,
//       label: data.new_currentstatus_label![index],
//     }));
//   }
// }




import axios from "axios";
import { AppDataSource } from "../config/database";
import { LeadFilterMaster } from "../entities/LeadFilterMaster";

interface StatusOption {
  value: number;
  label: string;
}

export class leadFilterStatus {
  private leadFilterStatusRepository = AppDataSource.getRepository(LeadFilterMaster);

  /**
   * Fetch OAuth token dynamically from .env credentials
   */
  private async getToken(): Promise<string> {
    const tenantId = process.env.DYNAMICS_TENANT_ID;
    const clientId = process.env.DYNAMICS_CLIENT_ID;
    const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
    const scope = process.env.DYNAMICS_RESOURCE;

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId!);
    params.append("client_secret", clientSecret!);
    params.append("scope", scope!);

    try {
      const response = await axios.post(url, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data.access_token;
    } catch (error: any) {
      console.error(" Error fetching Dynamics token:", error.response?.data || error.message);
      throw new Error("Failed to get OAuth token from Dynamics.");
    }
  }

  /**
   * Fetch 'new_currentstatus' picklist from Dynamics
   */
  async fetchFromDynamics(): Promise<StatusOption[]> {
    const token = await this.getToken();

    const url =
      "https://pinnaclemanagementcorporation.crm4.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='lead')/Attributes(LogicalName='new_currentstatus')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)";

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const options = response.data?.OptionSet?.Options || [];
    return options
      .map((opt: any) => ({
        value: opt?.Value,
        label: opt?.Label?.UserLocalizedLabel?.Label,
      }))
      .filter((opt: StatusOption) => opt.value !== undefined && opt.label);
  }

  /**
   * Save or update global lead statuses in DB
   * filterCode → stores new_currentstatus values
   * filterName → stores new_currentstatus_label labels
   */
  async saveStatusesToDB(): Promise<LeadFilterMaster[]> {
  const statuses = await this.fetchFromDynamics();

  const results: LeadFilterMaster[] = [];

  for (const s of statuses) {
    // Check if the status already exists
    let existing = await this.leadFilterStatusRepository.findOne({
      where: { filterCode: s.value.toString(), isDeleted: false },
    });

    if (existing) {
      // Update label if changed
      existing.filterName = s.label;
      existing.updatedAt = new Date();
      results.push(await this.leadFilterStatusRepository.save(existing));
    } else {
      // Create new row
      const newRow = this.leadFilterStatusRepository.create({
        filterCode: s.value.toString(),
        filterName: s.label,
        isActive: true,
        isDeleted: false,
      });
      results.push(await this.leadFilterStatusRepository.save(newRow));
    }
  }

  return results; // array of all saved/updated rows
}


  /**
   * Get stored global statuses
   */
  async getStoredStatuses(): Promise<{ value: string; label: string }[]> {
  const data = await this.leadFilterStatusRepository.find({
    where: { isDeleted: false },
  });

  return data.map((d) => ({
    value: d.filterCode,
    label: d.filterName,
  }));
}

}
