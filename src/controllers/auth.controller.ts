/**
 * Controller for handling authentication related operations
 * Handles token refresh and other auth operations
 */

import { Request, Response } from "express";
import { errorWithData } from "../config/ApiResponse";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

/**
 * Refresh access token using refresh token
 * @param req - Express request object containing refresh token in body
 * @param res - Express response object
 * @returns JSON response with new access token or error
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<any> => {

    try {
        const { refreshToken } = req.body;

        const cookie_refresh_token = req.cookies?.refreshToken; // Get token from cookies

        const token = (cookie_refresh_token) ? cookie_refresh_token : refreshToken;

        if (!token && token == "" && token.length <= 15) return res.status(400).json({ result: false, message: "Refresh token is required", data: null });

        const response: { [key: string]: any } = await authService.refreshToken(token);
        res.cookie("accessToken", response.data.accessToken, { httpOnly: true, secure: true, sameSite: "strict" });
        res.cookie("refreshToken", response.data.refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });

        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {

        const response = errorWithData("Refresh token error :", { error: error })
        return res.status(response.result ? 200 : 400).json(response)

    }
};
