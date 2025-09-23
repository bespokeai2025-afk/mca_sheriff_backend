import { Request, Response } from "express";
import { AttendanceOTPService } from "../services/attendanceotp.service";

import { errorWithData, errorWithoutData } from "../config/ApiResponse";

// Initialize the OTP service instance
const otpAttendanceService = new AttendanceOTPService();


/**
 * Controller to send OTP to a user's mobile number
 * @param req - Express request object containing mobile number in body
 * @param res - Express response object
 */
export const sendAttendanceOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile } = req.body;
        const response = await otpAttendanceService.sendAttendanceOTPToAdmin(mobile);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};

export const getAllAttendanceOtps = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await otpAttendanceService.getAllAttendanceOtps();
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
// export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { mobile, otp } = req.body;
//         const response: any = await otpService.verifyOtp(mobile, otp);
//         res.cookie("accessToken", response.data.accessToken, { httpOnly: true, secure: true, sameSite: "strict" });
//         res.cookie("refreshToken", response.data.refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData('Something went wrong', { error });
//         return res.status(400).json(response);
//     }
// };

export const verifyAttendanceOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return res.status(400).json(errorWithoutData("Mobile and OTP are required."));
        }

        const response: any = await otpAttendanceService.verifyAttendanceOTPForAdmin(mobile, otp);
      
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};


/**
 * Controller to send OTP to an admin's mobile number
 * @param req - Express request object containing mobile number in body
 * @param res - Express response object
 */
export const sendAttendanceOtpToAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile } = req.body;
        const response = await otpAttendanceService.sendAttendanceOTPToAdmin(mobile);
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
export const verifyAttendanceOTPForAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile, otp } = req.body;
        const response: any = await otpAttendanceService.verifyAttendanceOTPForAdmin(mobile, otp);
        res.cookie("accessToken", response.data.accessToken, { httpOnly: true, secure: true, sameSite: "lax" });
        res.cookie("refreshToken", response.data.refreshToken, { httpOnly: true, secure: true, sameSite: "lax" });
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error });
        return res.status(400).json(response);
    }
};
