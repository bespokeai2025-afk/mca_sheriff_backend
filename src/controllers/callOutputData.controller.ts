import { Request, Response } from "express";
import { Multer } from "multer";
// Import utilities and services
import { errorWithData, errorWithoutData, successWithData } from "../config/ApiResponse";
import { callOutputDataService } from "../services/callOutputData.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
// Initialize services and repositories
const calloutputdataservice = new callOutputDataService();
const userhistoryservice = new callOutputDataService();
const adminRepository = AppDataSource.getRepository(Admin);





//Yet To call
export const getUsercallingData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { pageSize = 50, currentPage = 1 } = req.query;

    // Assuming you already attach verifyUser to req in middleware
    const verifyUser = (req as any).verifyUser;

    const response = await calloutputdataservice.getUsercallingData(
      verifyUser,
      Number(pageSize),
      Number(currentPage)
    );

    return res.status(response.statuscode || 200).json(response);
  } catch (error) {
    console.error("Error in getUserYetToCall controller:", error);
    return res.status(500).json({
      result: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};







//Lead of user calls
export const getUsercallingDataLead = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      const response = errorWithoutData("Authentication failed");
      return res.status(response.result ? 200 : 400).json(response);
    }

    const { pageSize, currentPage } = req.query;

    const response = await calloutputdataservice.getUsercallingDataLead(
      req.verifyUser, // make sure middleware sets this
      parseInt(pageSize as string) || 50,
      parseInt(currentPage as string) || 1
    );

    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error: error });
    return res.status(response.result ? 200 : 400).json(response);
  }
};

export const getUsercallingHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      const response = errorWithoutData("Authentication failed");
      return res.status(response.result ? 200 : 400).json(response);
    }

    const { pageSize, currentPage, toNumber, status } = req.query;

    // Normalize and validate status
    let normalizedStatus: "completed" | "ongoing" | undefined;
    if (typeof status === "string") {
      const lower = status.toLowerCase();
      if (lower === "completed" || lower === "ongoing") {
        normalizedStatus = lower as "completed" | "ongoing";
      }
    }

    const response = await calloutputdataservice.getUsercallingHistory(
      req.verifyUser,
      parseInt(pageSize as string, 10) || 50,
      parseInt(currentPage as string, 10) || 1,
      toNumber as string,       // optional filter
      normalizedStatus          // optional filter
    );

    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(response.result ? 200 : 400).json(response);
  }
};

//count of user call 

// export const getUsercallingHistory = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const {
//       from_date,
//       to_date,
//       from_time,
//       to_time,
//       page,
//       pageSize,
//       toNumber,
//       status
//     } = req.body;

//     if (!from_date || !to_date) {
//       return res.status(400).json({
//         result: false,
//         statuscode: 400,
//         message: "from_date and to_date are required"
//       });
//     }

//     const result = await callOutputDataService.getUsercallingHistory(
//       from_date,
//       to_date,
//       from_time,
//       to_time,
//       page,
//       pageSize,
//       toNumber,
//       status
//     );

//     // 🚀 Return service result directly
//     res.status(result.statuscode).json(result);
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       result: false,
//       statuscode: 500,
//       message: "Failed to fetch call data",
//       error: error.message,
//     });
//   }
// };

export const getUserCallDataCount = async (req: Request, res: Response): Promise<any> => {
  try {
    const verifyUser = req.user; // assume auth middleware sets this
    if (!verifyUser) {
      const response = errorWithoutData("Unauthorized");
      return res.status(401).json(response);
    }

    // Pagination (even if not really needed for counts)
    const pageSize = Number(req.query.pageSize) || 10;
    const currentPage = Number(req.query.currentPage) || 1;

    // Call service
    const response = await calloutputdataservice.getUserCallDataCount(
      verifyUser,
      pageSize,
      currentPage
    );

    return res.status(response.result ? 200 : 400).json(response);

  } catch (error) {
    console.error("Error in getUserCallDataCount controller:", error);
    return res.status(500).json(
      errorWithData("Internal server error", { error: (error as Error).message })
    );
  }
};


export const createCallOutputData = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔍 Log the full request body
    console.log(" Incoming Request Body:", req.body, null, 2);

    // 🔍 If you only care about raw_data
    if (req.body.raw_data) {
      console.log(" Raw Data Payload:", req.body.raw_data);
    }

    const response = await calloutputdataservice.createCallOutputData(req.body);

    // 🔍 Log service response before sending
    console.log(" Service Response:", response);

    res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error creating call output data:", error);

    const response = errorWithData("Something went wrong", { error });
    res.status(400).json(response);
  }
};


export const deletefaq = async (req: Request, res: Response): Promise<any> => {

  try {
    if (!req.user) {
      const response = errorWithoutData("Authentication failed");
      return res.status(response.result ? 200 : 400).json(response);
    }
    const user = await adminRepository.findOneBy({ id: req.user.id })

    if (!user) {
      const response = errorWithoutData('Only admin can delete faq');
      return res.status(response.result ? 200 : 400).json(response);
    }

    const response = await calloutputdataservice.deletefaq(req.params.id, req.verifyUser);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("something went wrong", { error: error });
    return res.status(response.result ? 200 : 400).json(response);
  }
};
