import { Request, Response } from "express";
import { ReferralCodeService } from "../services/userReferralCode.service";
import { errorWithData } from "../config/ApiResponse";

// Initialize the ReferralCodeService instance
const referralCodeService = new ReferralCodeService();

// Controller to get all referral codes
export const getReferralCodes = async (req: Request, res: Response): Promise<any> => {
    try {
        // Fetch all referral codes using the referral code service
        const { pageSize, currentPage } = req.query;

        const response = await referralCodeService.findReferralCodes(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific referral code by ID
export const getReferralCodeById = async (req: Request, res: Response): Promise<any> => {
    try {
        // Fetch the referral code by ID using the referral code service
        const response = await referralCodeService.findReferralCodeById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific referral code by ID
export const getReferralCodeByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        // Fetch the referral code by ID using the referral code service
        const response = await referralCodeService.findReferralCodeByUserId(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
// Controller to get a specific referral code by ID
export const getReferralCodeByCode = async (req: Request, res: Response): Promise<any> => {
    try {
        // Fetch the referral code by ID using the referral code service
        const response = await referralCodeService.findReferralCodeByCode(req.query.code as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to verify a referral code
export const VerifyReferralCode = async (req: Request, res: Response): Promise<any> => {
    try {
        // Extract mobile number and referral code from the request body
        const { mobile, referralCode } = req.body;
        // Verify the referral code using the referral code service
        const response = await referralCodeService.verifyReferralCode(mobile, referralCode, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to create a new referral code
export const CreateReferralCode = async (req: Request, res: Response): Promise<any> => {
    try {
        // Extract the user ID from the request parameters
        const { id } = req.params;
        // Create a new referral code using the referral code service
        const response = await referralCodeService.createReferralCode(id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to update an existing referral code
export const updateReferralCode = async (req: Request, res: Response): Promise<any> => {
    try {
        // Update the referral code using the referral code service
        const response = await referralCodeService.updateReferralCode(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to delete a referral code
export const deleteReferralCode = async (req: Request, res: Response): Promise<any> => {
    try {
        // Delete the referral code using the referral code service
        const response = await referralCodeService.deleteReferralCode(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};