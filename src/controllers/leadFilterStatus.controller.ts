// import { Request, Response } from "express";
// import { leadFilterStatus } from "../services/leadFilterStatus.service";

// const leadFilterStatusService = new leadFilterStatus();

// export class LeadFilterStatusController {

//   /**
//    * Sync statuses from Dynamics CRM and store in DB
//    */
//  static async syncFromDynamics(req: Request, res: Response) {
//   try {
//     const data = await leadFilterStatusService.saveStatusesToDB();

//     return res.status(200).json({
//       success: true,
//       message: "Lead filter statuses synced successfully from Dynamics CRM.",
//       data: {
//         id: data.id,
//         filterCode: data.filterCode,
//         filterName: data.filterName,
//         new_currentstatus: data.new_currentstatus,
//         new_currentstatus_label: data.new_currentstatus_label,
//         updatedAt: data.updatedAt,
//       },
//     });
//   } catch (error: any) {
//     console.error("syncFromDynamics Error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// }


//   /**
//    * Get stored global statuses
//    */
//   static async getStored(req: Request, res: Response) {
//     try {
//       const data = await leadFilterStatusService.getStoredStatuses();

//       return res.status(200).json({
//         success: true,
//         message: "Fetched stored lead filter statuses.",
//         data,
//       });
//     } catch (error: any) {
//       console.error(" getStored Error:", error);
//       return res.status(500).json({ success: false, message: error.message });
//     }
//   }
// }



import { Request, Response } from "express";
import { leadFilterStatus } from "../services/leadFilterStatus.service";

const leadFilterStatusService = new leadFilterStatus();

export class LeadFilterStatusController {

  /**
   * Sync statuses from Dynamics CRM and store in DB
   */
  static async syncFromDynamics(req: Request, res: Response) {
    try {
      const data = await leadFilterStatusService.saveStatusesToDB();

      return res.status(200).json({
        success: true,
        message: "Lead filter statuses synced successfully from Dynamics CRM.",
        data: data.map((d) => ({
          id: d.id,
          filterCode: d.filterCode, // single status value
          filterName: d.filterName, // corresponding label
          updatedAt: d.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error("syncFromDynamics Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get stored global statuses
   */
  static async getStored(req: Request, res: Response) {
    try {
      const data = await leadFilterStatusService.getStoredStatuses();

      return res.status(200).json({
        success: true,
        message: "Fetched stored lead filter statuses.",
        data, // [{ value, label }, ...]
      });
    } catch (error: any) {
      console.error("getStored Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
