import { Repository } from "typeorm";
import { EmailVerification } from "../entities/EmailVerification";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { sendVerificationEmail } from "../utils/email";
import { generateToken, verifyToken } from "../utils/emailToken";
import { User } from "../entities/User";
import { sendEmail } from "./../config/sesMailer";
import { getVerifyEmailHTML } from "./../config/templates/verifyEmailTemplate";

export class EmailVerificationService {
    private emailVerificationRepository: Repository<EmailVerification> = AppDataSource.getRepository(EmailVerification);
    private userRepository: Repository<User> = AppDataSource.getRepository(User);

    private emailLimit: number = parseInt(process.env.DAILY_EMAIL_MAX_LIMIT || "20", 10) || 20;

    public async createVerificationToken(verifyUser: any) {
        if (!verifyUser || verifyUser.admin_exist) {
            return errorWithoutData("Unauthorized access");
        }

        const user = await this.userRepository.findOneBy({ id: verifyUser.user_exist.id });
        if (!user) {
            return errorWithoutData("user not found");
        }
        if (user.is_email_verified) {
            return errorWithoutData("Email already verified")
        }

        if (user.email == null) {
            return errorWithoutData("User does not have email")
        }


        const emailVerification: any = await this.emailVerificationRepository.findOne({ where: { user_id: { id: user.id } }, order: { "expires_at": "desc" } });

        let daily_count = 1;
        if (emailVerification) {
            daily_count = emailVerification.daily_count + 1;

            const resendAllowedAt = new Date(emailVerification.expires_at.getTime() - 18 * 60000);

            if (new Date() < resendAllowedAt) {
                const waitTime = Math.ceil((resendAllowedAt.getTime() - new Date().getTime()) / 60000);
                return errorWithoutData(`Email already sent. Try again after ${waitTime} minute(s).`);
            }

            if (emailVerification.daily_count > this.emailLimit) {
                return errorWithoutData("email limit exceeded");
            }

        }

        const token = generateToken(user.email);
        await this.emailVerificationRepository.save({ user_id: { id: user.id }, token, expires_at: new Date(new Date().getTime() + 20 * 60000), daily_count });

        // await sendVerificationEmail(user.email, token);

        this.sendAWSEMail(user.email, token)

        return successWithoutData("Verification email sent successfully");
    }

    public async verifyToken(token: string) {
        if (!token) {
            return errorWithoutData("Token is required");
        }

        const record = await this.emailVerificationRepository.findOneBy({ token });
        if (!record) {
            return errorWithoutData("Invalid or expired token");
        }

        if (record.expires_at < new Date()) {
            return errorWithoutData("Token expired");
        }

        const email = verifyToken(token);
        if (!email) {
            return errorWithoutData("Invalid token");
        }

        const user = await this.userRepository.findOneBy({ email });
        if (!user) {
            return errorWithoutData("User not found");
        }

        user.is_email_verified = true;
        await this.userRepository.save(user);


        return successWithoutData("Email verified successfully");
    }


    public async sendAWSEMail(toAddress: string, token: string) {
        try {
            const verificationLink = `${process.env.FRONTEND_URL}/auth/email/verify-email?token=${token}`;
            const htmlBody = getVerifyEmailHTML(verificationLink);

            await sendEmail({
                toAddress: toAddress,
                subject: "Verify Your Email Address",
                htmlBody: htmlBody,
            });

            console.log(`✅ Email sent successfully to ${toAddress}`);
        } catch (error) {
            console.error(`❌ Failed to send verification email to ${toAddress}:`, error);
            // optionally rethrow or handle differently
            throw error;
        }
    }

}
