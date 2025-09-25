import { AppDataSource } from "../config/database";
// import { UserReferralCode } from "../entities/UserReferralCode";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { User } from "../entities/User";

import crypto from 'crypto'
import { deleteUserToken } from "../utils/jwtUtils";
// import { RewardsHistory } from "../entities/RewardHistory";
// import { NotificationService } from "./notification.service";
// import { createBatchNotificationJob, createTopicNotificationJob } from "../workers/notification.worker";
import { DeviceTokenService } from "./deviceToken.service";
// import { PushNotificationService } from "./pushNotification.service";
// const notificationService = new NotificationService();
const deviceTokenService = new DeviceTokenService();
// const pushNotificationService = new PushNotificationService();

export class ReferralCodeService {
    // private userReferralCodeRepository = AppDataSource.getRepository(UserReferralCode)
    private userRepository = AppDataSource.getRepository(User)
    // private rewardHistoryRepository = AppDataSource.getRepository(RewardsHistory)

    // public async verifyReferralCode(mobile: string, referralCode: string, verifyUser: any): Promise<any> {

    //     const user = await this.userRepository.findOneBy({ mobile });
    //     if (!user) return errorWithoutData("Invalid user")

    //     let code = await this.userReferralCodeRepository.findOne({ where: { referral_code: referralCode }, relations: ["user_id"] })

    //     if (!code || code.user_id.id === user.id) {
    //         return errorWithoutData('Invalid referral Code')
    //     }


    //     if (user.id != verifyUser.user_exist.id) {
    //         return errorWithoutData("User is not Authenticated")
    //     }

    //     const rewardHistory = await this.rewardHistoryRepository.findOne({
    //         where: {
    //             user_id: { id: user.id }, description: "Referral Coins added"
    //         }
    //     })

    //     if (rewardHistory) {
    //         return errorWithoutData('Referral code has already been redeemed')
    //     }

    //     if (!code.isActive || code.isDeleted) return errorWithoutData('invalid referral Code')


    //     const new_reward_history = await this.rewardHistoryRepository.create({
    //         user_id: { id: user.id },
    //         referred_user_id: { id: code.user_id.id },
    //         transaction_type: "Earned",
    //         amount: code.default_reward_coins,
    //         reward_type: "referral",
    //         description: "Referral Coins added"
    //     })
    //     await this.rewardHistoryRepository.save(new_reward_history)

    //     const referred_user: User | null = await this.userRepository.findOneBy({ id: code.user_id.id })

    //     if (!referred_user) return errorWithoutData('Referred user not found')

    //     referred_user.coins += code.default_reward_coins

    //     await this.userRepository.save(referred_user)

    //     const new_reward_history_referral_user = await this.rewardHistoryRepository.create({
    //         user_id: { id: referred_user.id },
    //         referrer_id: { id: user.id },
    //         transaction_type: "Earned",
    //         amount: code.default_reward_coins,
    //         reward_type: "referral",
    //         description: "Referral coins for referring a user"
    //     })
    //     await notificationService.sendGeneralNotification(
    //         referred_user.id,

    //         `🎉 You've earned ${code.default_reward_coins} coins for referring a new user!`
    //     );

    //     await this.rewardHistoryRepository.save(new_reward_history_referral_user)

    //     await this.userRepository.update({ id: user.id }, { coins: user.coins + code.default_reward_coins })
    //     await notificationService.sendGeneralNotification(
    //         user.id,
    //         // No event associated here
    //         `🎉 You've earned ${code.default_reward_coins} coins for using a referral code!`
    //     );

    //     // ✅ Send Notification to Referrer

    //     return successWithData('Referral code is valid', { referralCode: code.referral_code, reward: code.default_reward_coins });

    // }
    // public async verifyReferralCode(mobile: string, referralCode: string, verifyUser: any): Promise<any> {
    //     const user = await this.userRepository.findOneBy({ mobile });
    //     if (!user) return errorWithoutData("Invalid user");

    //     // Check if referral code exists and is not used by the same user
    //     let code = await this.userReferralCodeRepository.findOne({
    //         where: { referral_code: referralCode },
    //         relations: ["user_id"]
    //     });

    //     if (!code || code.user_id.id === user.id) {
    //         return errorWithoutData("Invalid referral code");
    //     }

    //     if (user.id !== verifyUser.user_exist.id) {
    //         return errorWithoutData("User is not authenticated");
    //     }

    //     // Check if referral reward has already been redeemed
    //     const rewardHistory = await this.rewardHistoryRepository.findOne({
    //         where: { user_id: user, description: "Referral Coins added" }
    //     });

    //     if (rewardHistory) {
    //         return errorWithoutData("Referral code has already been redeemed");
    //     }

    //     if (!code.isActive || code.isDeleted) {
    //         return errorWithoutData("Invalid referral code");
    //     }

    //     // Reward amount from referral code
    //     const rewardCoins = code.default_reward_coins;

    //     // ✅ Step 1: Reward to the user who used the referral code
    //     const userRewardEntry = this.rewardHistoryRepository.create({
    //         user_id: user,
    //         referred_user_id: code.user_id,
    //         transaction_type: "Earned",
    //         amount: rewardCoins,
    //         reward_type: "referral",
    //         description: "Referral Coins added"
    //     });

    //     const userReward = await this.rewardHistoryRepository.save(userRewardEntry);

    //     let tokens: string[] = [];
    //     const device_token: any = await deviceTokenService.findByUserId(user.id, verifyUser)

    //     tokens.push(device_token.data.token)

    //     const batchJobData = {
    //         title: `New Reward Earned`,
    //         message: `🎉 Congrats! You’ve earned ${rewardCoins} points by using the referral Code. Check your reward wallet now!`,
    //         delay: 0,
    //         scheduledTime: new Date(),
    //         tokens: tokens,
    //         payload: {
    //             notificationType: "reward_earned",
    //             notificationTitle: `New Reward Earned`,
    //             notificationMessage: `🎉 Congrats! You’ve earned ${rewardCoins} points by using the referral Code. Check your reward wallet now!`,
    //             rewardId: userReward.id,
    //             rewardAmount: userReward.amount,
    //         },
    //     };

    //     await pushNotificationService.create({
    //         title: batchJobData.title,
    //         message: batchJobData.message,
    //         payload: batchJobData.payload,
    //         tokens: batchJobData.tokens,
    //         delay: batchJobData.delay,
    //         scheduledTime: batchJobData.scheduledTime.toISOString().split('T')[0]
    //     });

    //     await createBatchNotificationJob(batchJobData.title, batchJobData.message, batchJobData.payload, batchJobData.tokens, batchJobData.delay)

    //     // ✅ Step 2: Update user’s coin balance
    //     user.coins += rewardCoins;
    //     await this.userRepository.save(user);

    //     await notificationService.sendGeneralNotification(
    //         user.id,
    //         `🎉 You've earned ${rewardCoins} coins for using a referral code!`
    //     );

    //     // ✅ Step 3: Reward to the referrer (user who generated the referral code)
    //     const referrer = await this.userRepository.findOneBy({ id: code.user_id.id });
    //     if (!referrer) return errorWithoutData("Referred user not found");

    //     referrer.coins += rewardCoins;
    //     await this.userRepository.save(referrer);

    //     const referrerRewardEntry = this.rewardHistoryRepository.create({
    //         user_id: referrer,
    //         referrer_id: user,
    //         transaction_type: "Earned",
    //         amount: rewardCoins,
    //         reward_type: "referral",
    //         description: "Referral coins for referring a user"
    //     });
    //     const referrer_reward = await this.rewardHistoryRepository.save(referrerRewardEntry);

    //     let r_token: string[] = [];
    //     const referrer_token: any = await deviceTokenService.findByUserId(referrer.id, verifyUser)

    //     r_token.push(referrer_token.data.token)

    //     const batchJobDataforReferrer = {
    //         title: `New Reward Earned`,
    //         message: `🎊 ${user.name} just joined using your referral link! You’ve earned ${rewardCoins} points!`,
    //         delay: 0,
    //         scheduledTime: new Date(),
    //         tokens: r_token,
    //         payload: {
    //             notificationType: "reward_earned",
    //             notificationTitle: `New Reward Earned`,
    //             notificationMessage: `🎊 ${user.name} just joined using your referral link! You’ve earned ${rewardCoins} points!`,
    //             rewardId: referrer_reward.id,
    //             rewardAmount: referrer_reward.amount,
    //         },
    //     };

    //     await pushNotificationService.create({
    //         title: batchJobDataforReferrer.title,
    //         message: batchJobDataforReferrer.message,
    //         payload: batchJobDataforReferrer.payload,
    //         tokens: batchJobDataforReferrer.tokens,
    //         delay: batchJobDataforReferrer.delay,
    //         scheduledTime: batchJobDataforReferrer.scheduledTime.toISOString().split('T')[0]
    //     });

    //     await createBatchNotificationJob(batchJobDataforReferrer.title, batchJobDataforReferrer.message, batchJobDataforReferrer.payload, batchJobDataforReferrer.tokens, batchJobDataforReferrer.delay)

    //     await notificationService.sendGeneralNotification(
    //         referrer.id,
    //         `🎉 You've earned ${rewardCoins} coins for referring a new user!`
    //     );

    //     return successWithData("Referral code is valid", { referralCode: code.referral_code, reward: rewardCoins });
    // }

    // public async verifyReferralCode(mobile: string, referralCode: string, verifyUser: any): Promise<any> {
    //     const user = await this.userRepository.findOneBy({ mobile });
    //     if (!user || user.id !== verifyUser.user_exist.id) return errorWithoutData("Invalid user or not authenticated");

    //     const code = await this.userReferralCodeRepository.findOne({ where: { referral_code: referralCode }, relations: ["user_id"] });
    //     if (!code || code.user_id.id === user.id || !code.isActive || code.isDeleted) return errorWithoutData("Invalid referral code");

    //     const userHistory = await this.userRepository.findOne({ where: { id: user.id, isJoiningRewardClaimed: true } });

    //     if (userHistory) return successWithoutData("This user has already claimed the referral reward for joining.");

    //     const rewardCoins = code.default_reward_coins;
    //     await this.rewardHistoryRepository.save(this.rewardHistoryRepository.create({
    //         user_id: user, referred_user_id: code.user_id, transaction_type: "Earned",
    //         amount: rewardCoins, reward_type: "referral", description: "Referral Coins added"
    //     }));

    //     user.coins += rewardCoins;
    //     user.isJoiningRewardClaimed = true;
    //     await this.userRepository.save(user);
    //     await this.sendRewardNotification(user, rewardCoins, "You've earned coins for using a referral code!", verifyUser);
    //     await notificationService.sendGeneralNotification(
    //         user.id,
    //         `🎉 You've earned ${rewardCoins} coins for using a referral code!`
    //     );
    //     const referrer = await this.userRepository.findOneBy({ id: code.user_id.id });
    //     if (!referrer) return errorWithoutData("Referred user not found");

    //     referrer.coins += rewardCoins;
    //     await this.userRepository.save(referrer);
    //     await this.rewardHistoryRepository.save(this.rewardHistoryRepository.create({
    //         user_id: referrer, referrer_id: user, transaction_type: "Earned",
    //         amount: rewardCoins, reward_type: "referral", description: "Referral coins for referring a user"
    //     }));
    //     await this.sendRewardNotification(referrer, rewardCoins, `New user joined using your referral link!`, verifyUser);
    //     await notificationService.sendGeneralNotification(
    //         referrer.id,

    //         `🎉 You've earned ${code.default_reward_coins} coins for referring a new user!`
    //     );
    //     return successWithData("Referral code is valid", { referralCode: code.referral_code, reward: rewardCoins });
    // }

    // private async sendRewardNotification(user: any, rewardCoins: number, message: string, verifyUser: any) {
    //     const deviceToken = await deviceTokenService.findByUserId(user.id, verifyUser);
    //     console.log('dgrdtrter')
    //     if (!deviceToken || !deviceToken.data || typeof deviceToken.data !== "object") return;

    //     const token = (deviceToken.data as { token?: string }).token;
    //     if (!token) return;

    //     const payload = {
    //         notificationType: "reward_earned",
    //         notificationTitle: "New Reward Earned",
    //         notificationMessage: `🎉 ${message} You've earned ${rewardCoins} coins!`,
    //         rewardAmount: String(rewardCoins)
    //     };
    //     console.log('payload', payload)
    //     await pushNotificationService.create({
    //         title: "New Reward Earned",
    //         message: payload.notificationMessage,
    //         payload,
    //         tokens: [token],
    //         scheduledTime: new Date().toISOString().split('T')[0]
    //     });

    //     const tokens = [token];

    //     await createBatchNotificationJob("New Reward Earned", payload.notificationMessage, payload, tokens, 0);

    //     // await notificationService.sendGeneralNotification(user.id, payload.notificationMessage);
    // }

    // public async createReferralCode(id: string, verifyUser: any): Promise<any> {

    //     let user = await this.userRepository.findOneBy({ id })

    //     if (!user) {
    //         return errorWithoutData('Invalid User')
    //     }


    //     if (verifyUser.user_exist != null && user.id != verifyUser.user_exist.id) {
    //         return errorWithoutData('User is not authorized to create referral code')
    //     }

    //     if (verifyUser.admin_exist) {
    //         return errorWithoutData('Admin is not authorized to create referral code')
    //     }

    //     let referral_code = await this.userReferralCodeRepository.findOne({ where: { user_id: { id: user.id } }, relations: ['user_id'] })

    //     if (referral_code) {
    //         return errorWithoutData('referral code already generated')
    //     }

    //     const new_referral_code = crypto.randomBytes(4).toString('hex').toUpperCase()

    //     const new_code = await this.userReferralCodeRepository.create({ user_id: { id: user.id }, referral_code: new_referral_code, default_reward_coins: 50 })

    //     await this.userReferralCodeRepository.save(new_code);

    //     return successWithData('User Referral code Created Successfully', { referral_code: new_referral_code });

    // }

    // public async findReferralCodes(verifyUser: any, pageSize: number, currentPage: number) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData("Users are not authorized to view referral codes")
    //     }

    //     let whereCondition = {};

    //     const [referralCodes, totalItems] = await this.userReferralCodeRepository.findAndCount({
    //         where: whereCondition,
    //         order: { createdAt: 'DESC' },
    //         skip: (currentPage - 1) * pageSize,
    //         take: pageSize,
    //         relations: ['user_id']
    //     });

    //     const totalPages = Math.ceil(totalItems / pageSize);

    //     if (totalItems >= 1 && totalPages < currentPage) {
    //         return errorWithoutData("Page limit exceeded")
    //     }

    //     return successWithData("all referral codes", referralCodes, {
    //         totalItems,
    //         totalPages,
    //         currentPage,
    //         pageSize
    //     });
    // }

    // public async findReferralCodeById(id: string, verifyUser: any) {

    //     let referralCode;
    //     if (verifyUser.user_exist) {
    //         referralCode = await this.userReferralCodeRepository.findOne({ where: { id, isActive: true, isDeleted: false }, relations: ['user_id'] });
    //     } else {
    //         referralCode = await this.userReferralCodeRepository.findOne({ where: { id, }, relations: ['user_id'] });
    //     }

    //     if (!referralCode) {
    //         return errorWithoutData("Referral code not found");
    //     }

    //     return successWithData("Referral code found", referralCode);
    // }

    // public async findReferralCodeByUserId(id: string, verifyUser: any) {

    //     const user = await this.userRepository.findOneBy({ id })
    //     if (!user) {
    //         return errorWithoutData("User not found");
    //     }

    //     let referralCode;
    //     if (verifyUser.user_exist) {
    //         referralCode = await this.userReferralCodeRepository.find({ where: { user_id: { id: user.id }, isActive: true, isDeleted: false }, relations: ['user_id'] });
    //     } else {
    //         referralCode = await this.userReferralCodeRepository.find({ where: { user_id: { id: user.id }, }, relations: ['user_id'] });
    //     }

    //     if (referralCode.length <= 0) {
    //         return errorWithoutData("Referral code not found");
    //     }

    //     return successWithData("Referral code found", referralCode);
    // }
    // public async findReferralCodeByCode(code: string, verifyUser: any) {

    //     let referralCode;
    //     if (verifyUser.user_exist) {
    //         referralCode = await this.userReferralCodeRepository.find({ where: { referral_code: code, isActive: true, isDeleted: false }, relations: ['user_id'] });
    //     } else {
    //         referralCode = await this.userReferralCodeRepository.find({ where: { referral_code: code }, relations: ['user_id'] });
    //     }

    //     if (referralCode.length <= 0) {
    //         return errorWithoutData("Referral code not found");
    //     }

    //     return successWithData("Referral code found", referralCode);
    // }

    // public async updateReferralCode(id: string, data: { [key: string]: any }, verifyUser: any) {
    //     if (verifyUser.user_exist) {
    //         return errorWithoutData("User cannot update referral code")
    //     }

    //     const referralCode = await this.userReferralCodeRepository.findOne({ where: { id, isActive: true, isDeleted: false } });

    //     if (!referralCode) {
    //         return errorWithoutData("Referral code not found");
    //     }

    //     await this.userReferralCodeRepository.update(id, data);
    //     return successWithoutData("Referral code updated successfully");
    // }

    // public async deleteReferralCode(id: string, verifyUser: any) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData("User cannot delete referral code")
    //     }

    //     const referralCode = await this.userReferralCodeRepository.findOne({ where: { id, isActive: true, isDeleted: false } });

    //     if (!referralCode) {
    //         return errorWithoutData("Referral code not found");
    //     }

    //     referralCode.isDeleted = true;

    //     referralCode.isActive = false;


    //     await this.userReferralCodeRepository.save(referralCode);
    //     return successWithoutData("Referral code deleted successfully");
    // }

}

