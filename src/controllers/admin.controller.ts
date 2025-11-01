import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { AdminService } from "../services/admin.service";

const adminService = new AdminService();

export const getAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed1");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.findAdmin(req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAdminById = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(400).json(response);
        }

        const response = await adminService.findAdminById(
            req.query.id as string,
            req.verifyUser
        );

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        console.error("Error in getAdminById:", error);
        const response = errorWithoutData("Something went wrong while fetching admin data.");
        return res.status(500).json(response);
    }
};



// export const updateAdmin = async (req: Request, res: Response): Promise<any> => {

//     try {
//         if (!req.user || !req.verifyUser) {
//             const response = errorWithoutData("Authentication failed");
//             return res.status(response.result ? 200 : 400).json(response);
//         }
//         const response = await adminService.updateAdmin(req.params.id, req.body, req.verifyUser);
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData("something went wrong", { error: error });
//         return res.status(response.result ? 200 : 400).json(response);
//     }
// };


export const updateAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        //  Service now only updates allowed fields (name, lastName, organization, mobile)
        const response = await adminService.updateAdmin(req.params.id, req.body, req.verifyUser);

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};



export const deleteAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.deleteAdmin(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const logoutAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Delete the user using the user service
        const response = await adminService.logoutAdmin(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};



export const loginAdminWithEmailPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        //  Do not check req.user or req.verifyUser here
        const response: any = await adminService.loginAdminWithEmailPassword(req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


export const createAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const response: any = await adminService.createAdmin(req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: unknown) {
        console.error("Create Admin Error:", error);

        // Type guard to safely access error.message
        const errorMessage = error instanceof Error ? error.message : String(error);

        const response = errorWithData("Something went wrong", { error: errorMessage });
        return res.status(500).json(response);
    }
};



export const changePassword = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check authentication
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(401).json(response); // 401 Unauthorized
        }

        // Call service
        const response = await adminService.changePassword(req.params.id, req.body, req.verifyUser);

        // If validation fails or other handled errors, return 400
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: unknown) {
        // Type-safe error handling
        const errorMessage = error instanceof Error ? error.message : String(error);

        const response = errorWithoutData(`Something went wrong: ${errorMessage}`);
        return res.status(500).json(response); // 500 for server errors
    }
};


export const requestPasswordReset = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await adminService.requestPasswordReset(req.body.email);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(500).json(response);
    }
};

export const verifyResetToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await adminService.verifyResetToken(req.body.token);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(500).json(response);
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const response = await adminService.resetPassword(token, newPassword, confirmPassword);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(500).json(response);
    }
};

