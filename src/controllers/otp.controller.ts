import { Request, Response } from "express";
import { OTPService } from "../services/otp.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";

// Initialize the OTP service instance
const otpService = new OTPService();


/**
 * Controller to send OTP to a user's mobile number
 * @param req - Express request object containing mobile number in body
 * @param res - Express response object
 */
export const sendOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile } = req.body;
        const response = await otpService.sendOtp(mobile);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};

export const getAllOtps = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await otpService.getAllOtps();
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};

/**
 * Controller to verify the OTP entered by the user
 * @param req - Express request object containing mobile number and OTP in body
 * @param res - Express response object
 */

export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return res.status(400).json(errorWithoutData("Mobile and OTP are required."));
        }

        const response: any = await otpService.verifyOtp(mobile, otp);
        if (response.result) {
            res.cookie("accessToken", response.data.accessToken, { httpOnly: true, secure: true, sameSite: "lax" });
            res.cookie("refreshToken", response.data.refreshToken, { httpOnly: true, secure: true, sameSite: "lax" });
        }
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};


/**
 * Controller to send OTP to an admin's mobile number
 * @param req - Express request object containing mobile number in body
 * @param res - Express response object
 */
export const sendOtpToAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile } = req.body;
        const response = await otpService.sendOTPToAdmin(mobile);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};

/**
 * Controller to verify OTP entered by the admin
 * @param req - Express request object containing mobile number and OTP in body
 * @param res - Express response object
 */
export const verifyOTPForAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile, otp } = req.body;
        const response: any = await otpService.verifyOTPForAdmin(mobile, otp);
        if (response.result) {
            res.cookie("accessToken", response.data.accessToken, { httpOnly: true, secure: true, sameSite: "lax" });
            res.cookie("refreshToken", response.data.refreshToken, { httpOnly: true, secure: true, sameSite: "lax" });
        }
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};
