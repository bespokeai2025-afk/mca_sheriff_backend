import { User } from "../entities/User";
import { AppDataSource } from "../config/database";
import { UserReferralCode } from "../entities/UserReferralCode";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { RewardsHistory } from "../entities/RewardHistory";
import { NotificationService } from './notification.service';
import { DeviceTokenService } from "./deviceToken.service";
import { PushNotificationService } from "./pushNotification.service";
import { createBatchNotificationJob } from "../workers/notification.worker";
import { profileCompletionQueue } from "../workers/notification.worker"
const notificationService = new NotificationService();

const pushNotificationService = new PushNotificationService();
const deviceTokenService = new DeviceTokenService();
export class ProfileService {
    private userRepository = AppDataSource.getRepository(User);
    private referralCodeRepository = AppDataSource.getRepository(UserReferralCode)
    private rewardsHistoryRepository = AppDataSource.getRepository(RewardsHistory);


    public async completeProfile(mobile: string, name: string, verifyUser: any) {
        try {

            let user = await this.userRepository.findOne({ where: { mobile } });

            if (!user) {
                return errorWithoutData("user does not exist")
            }


            if (user.id != verifyUser.user_exist.id) {
                return errorWithoutData("Unauthorized user")
            }

            // Check if user is blocked or deleted
            if (!user.isActive || user.isDeleted || !user.is_otp_verified) {
                return errorWithoutData("User is not allowed to complete profile");
            }

            if (user.isProfileCompleted) {
                return successWithoutData("Profile already completed")
            }

            await this.userRepository.update({ id: user.id }, { name, isProfileCompleted: true, coins: 100 })
            const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
            const rewardAmount = 100; // Set reward points (adjust as needed)

            await this.rewardsHistoryRepository.save({
                user_id: { id: user.id },
                transaction_type: 'Earned',
                reward_type: 'event',
                amount: rewardAmount,
                description: 'Profile completion reward',
            });
            await profileCompletionQueue.add(
                'sendDelayedWelcomeNotification',
                {
                    userId: user.id,
                    message: `🎉 Welcome to your profile! You've earned ${rewardAmount} coins`,

                },
                {
                    delay: 120 * 1000, // 1 minute delay
                    attempts: 3,

                }
            );
            await profileCompletionQueue.add(
                'sendDelayedWelcomeNotification',
                {
                    userId: user.id,
                    message: `💡 Invite your friends and get 50 bonus points for every signup!`,

                },
                {
                    delay: 180 * 1000, // 1 minute delay
                    attempts: 3,

                }
            );

            console.log("Profile completion notification queued")

            const data = {
                mobile, name
            }

            await this.sendProfileCompleteNotification(user, `Great job! Your profile is now complete.`, verifyUser)

            return successWithData("Profile updated successfully", data)


        } catch (err) {
            console.log(err)
            return errorWithData('Internal server Error', { error: err })
        }
    }

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

        await pushNotificationService.create({
            title: "Profile Completed Successfully!",
            message: payload.notificationMessage,
            payload,
            tokens: [token],
            scheduledTime: new Date().toISOString().split('T')[0]
        });

        const tokens = [token];

        await createBatchNotificationJob(payload.notificationTitle, payload.notificationMessage, payload, tokens, 0);

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