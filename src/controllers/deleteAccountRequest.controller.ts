import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { DeleteAccountRequestService } from "../services/deleteAccountRequest.service";

// Initialize the UserService instance
const deleteRequestService = new DeleteAccountRequestService();



// Controller to delete a user
export const createDeleteRequest = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json(errorWithoutData("Authentication required"));
        }

        const response = await deleteRequestService.createDeleteRequest(req.user.id, "reason");
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

export const updateDeleteRequestStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json(errorWithoutData("Authentication required"));
        }

        const { status } = req.body;
        if (!["COMPLETED", "REJECTED"].includes(status)) {
            return res.status(400).json(errorWithoutData("Invalid status"));
        }

        const response = await deleteRequestService.updateRequestStatus(req.params.id, status, req.user.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

export const getAllDeleteRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json(errorWithoutData("Authentication required"));
        }

        const { pageSize, currentPage } = req.query;
        const response = await deleteRequestService.getAllDeleteRequests(
            parseInt(pageSize as string) || 10,
            parseInt(currentPage as string) || 1, req.verifyUser
        );
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};