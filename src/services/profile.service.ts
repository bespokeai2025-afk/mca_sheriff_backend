import { User } from "../entities/User";
import { AppDataSource } from "../config/database";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";

import { DeviceTokenService } from "./deviceToken.service";
const deviceTokenService = new DeviceTokenService();
export class ProfileService {
    private userRepository = AppDataSource.getRepository(User);
    private async sendProfileCompleteNotification(user: any, message: string, verifyUser: any) {
        const deviceToken = await deviceTokenService.findByUserId(user.id, verifyUser);
        if (!deviceToken || !deviceToken.data || typeof deviceToken.data !== "object") return;

        const token = (deviceToken.data as { token?: string }).token;
        if (!token) return;


        const payload = {
            notificationType: "profile_completed",
            notificationTitle: "Profile Completed Successfully!",
            notificationMessage: message,
            userId: user.id,
        };

        const tokens = [token];

        return user;
    }

    public async findProfile(id: string, verifyUser: any) {

        let user = null;
        if (verifyUser.admin_exist) {
            user = await this.userRepository.findOneBy({ id })
        } else if (verifyUser.user_exist) {
            user = await this.userRepository.findOne({ where: { id, isActive: true } })
        }

        if (!user) {
            return errorWithoutData('user not found')
        }

        if (!user.is_otp_verified) {
            return errorWithoutData('user OTP not verified')
        }

        return successWithData("user profile", user);
    }
}