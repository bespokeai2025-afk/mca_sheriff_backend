import { AppDataSource } from "../config/database";
import { RewardsHistory } from "../entities/RewardHistory";
import {
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { UserReferralCode } from "../entities/UserReferralCode";
import { User } from "../entities/User";

export class CoinService {
  private rewardHistoryRepository = AppDataSource.getRepository(RewardsHistory);
  private userReferralCodeRepository =
    AppDataSource.getRepository(UserReferralCode);
  private userRepository = AppDataSource.getRepository(User);

  public async getAllCoins(id: string, verifyUser: any) {
    const user = await this.userRepository.findOneBy({
      id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!user) {
      return errorWithoutData("User not found");
    }
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const sum = await this.rewardHistoryRepository.sum("amount", {
      user_id: { id },
    });

    // const totalPages = Math.ceil(totalItems / pageSize);

    return successWithData("All Reward History", { count: sum || 0 });
  }
}
