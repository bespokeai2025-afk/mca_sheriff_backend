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


//Get user calling response
// export const getUsercallingData = async (req: Request, res: Response): Promise<any> => {

//     try {
//         if (!req.user) {
//             const response = errorWithoutData("Authentication failed");
//             return res.status(response.result ? 200 : 400).json(response);
//         }
//         const { pageSize, currentPage } = req.query;


//         const response = await calloutputdataservice.getUsercallingData(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData('something went wrong', { error: error });
//         return res.status(response.result ? 200 : 400).json(response);
//     }
// };



//Yet To call
export const getUsercallingData = async (req: Request, res: Response) : Promise<any> => {
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




//Lead
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
    const response = errorWithData("Something went wrong", { error:error });
    return res.status(response.result ? 200 : 400).json(response);
  }
};





// export const getUsercallingHistory = async (
//     req: Request,
//     res: Response
// ): Promise<any> => {
//     try {
//         if (!req.user) {
//             const response = errorWithoutData("Authentication failed");
//             return res.status(response.result ? 200 : 400).json(response);
//         }

//         // extract query params
//         const { pageSize, currentPage, to_number } = req.query;

//         // normalize query param `to_number` -> `toNumber` (entity property)
//         const toNumber = to_number ? String(to_number) : undefined;

//         // parse integers if provided; leave undefined if not
//         const size = pageSize ? parseInt(pageSize as string, 10) : undefined;
//         const page = currentPage ? parseInt(currentPage as string, 10) : undefined;

//         const response = await calloutputdataservice.getUsercallingHistory(
//             req.verifyUser,
//             size,   // optional pageSize
//             page,   // optional currentPage
//             toNumber
//         );

//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData("Something went wrong", { error });
//         return res.status(response.result ? 200 : 400).json(response);
//     }
// };




// Get User call history
export const getUsercallingHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const { pageSize, currentPage, toNumber } = req.query;

        const response = await calloutputdataservice.getUsercallingHistory(
            req.verifyUser,
            parseInt(pageSize as string) || 50,
            parseInt(currentPage as string) || 1,
            toNumber as string // optional filter
        );

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


export const getUserCallDataCount = async (req: Request, res: Response): Promise<any> => {
    try {
        const verifyUser = req.user; // assume auth middleware sets this
        if (!verifyUser) {
            return res.status(401).json(errorWithoutData("Unauthorized"));
        }

        // Parse pagination query params
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const currentPage = parseInt(req.query.currentPage as string) || 1;

        // Call service
        const result = await calloutputdataservice.getUserCallDataCount(verifyUser, pageSize, currentPage);

        // Send the service response directly
        return res.status(200).json(result);

    } catch (error) {
        console.error(" Error in getUserCallData controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            data: { error: (error as Error).message }
        });
    }
};

export const createCallOutputData = async (req: Request, res: Response): Promise<void> => {
    try {
        // 🔍 Log the full request body
        console.log("👉 Incoming Request Body:", req.body, null, 2);

        // 🔍 If you only care about raw_data
        if (req.body.raw_data) {
            console.log("👉 Raw Data Payload:", req.body.raw_data);
        }

        const response = await calloutputdataservice.createCallOutputData(req.body);

        // 🔍 Log service response before sending
        console.log("✅ Service Response:", response);

        res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        console.error("❌ Error creating call output data:", error);

        const response = errorWithData("Something went wrong", { error });
        res.status(400).json(response);
    }
};
export const updateCallOutputData = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update call output data ');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        // if (req.file) {
        //     data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        // } else {
        //     delete data.image;
        // }

        const response: any = await calloutputdataservice.updateCallOutputData(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
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
