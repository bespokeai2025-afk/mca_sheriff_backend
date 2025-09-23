import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { EmailVerificationService } from "../services/emailVerification.service";
import { AppDataSource } from "../config/database";
import { EmailVerification } from "../entities/EmailVerification";
import { User } from "../entities/User";
import { verifyToken } from "../utils/emailToken";

// Initialize the EmailVerificationService instance
const emailVerificationService = new EmailVerificationService();

// Get the repository for the Admin entity
const emailVerificationRepository = AppDataSource.getRepository(EmailVerification);
const userRepository = AppDataSource.getRepository(User);

// Controller to request an email verification token
export const requestEmailVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await emailVerificationService.createVerificationToken(req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        console.log(error)
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to verify email with token
export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const token: string = req.query.token as string;
        if (!token) {
            return res.render("error-page", { error_message: "Token is required" });
        }

        const record = await emailVerificationRepository.findOneBy({ token });
        if (!record) {

            return res.render("error-page", { error_message: "Invalid or expired token" });
        }

        if (record.expires_at < new Date()) {
            return res.render("error-page", { error_message: "Link expired" });
        }

        const email = verifyToken(token);
        if (!email) {
            return res.render("error-page", { error_message: "Invalid token" });
        }

        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return res.render("error-page", { error_message: "User not found" });
        }

        if (user.is_email_verified) {
            return res.render("error-page", { error_message: "Email already verified" });
        }

        user.is_email_verified = true;
        await userRepository.save(user);

        const userEmail = user.email;


        return res.render("verification-success", { userEmail })

        // const response = await emailVerificationService.verifyToken(req.params.token);
        // return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // const response = errorWithData('something went wrong', { error: error });
        return res.send("<h2>Something went wrong</h2>");

    }
};

// Controller to resend verification email
// export const resendVerificationEmail = async (req: Request, res: Response): Promise<any> => {
//     try {
//         if (!req.user) {
//             const response = errorWithoutData("Authentication failed");
//             return res.status(response.result ? 200 : 400).json(response);
//         }

//         const response = await emailVerificationService.resendVerificationEmail(req.user.id);
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData('something went wrong', { error: error });
//         return res.status(response.result ? 200 : 400).json(response);
//     }
// };
