import { AppDataSource } from "../config/database";
import { RewardsHistory } from "../entities/RewardHistory";
import {
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { UserReferralCode } from "../entities/UserReferralCode";

export class RewardHistoryService {
  private rewardHistoryRepository = AppDataSource.getRepository(RewardsHistory);
  private userReferralCodeRepository =
    AppDataSource.getRepository(UserReferralCode);

  public async findAllRewardHistories(
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const [rewardHistories, totalItems] =
      await this.rewardHistoryRepository.findAndCount({
        where: whereCondition,
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["user_id", "event_id", "referred_user_id", "referrer_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);

    return successWithData("All Reward History", rewardHistories, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async findRewardHistoryById(id: string, verifyUser: any) {
    let rewardHistory;
    if (verifyUser.user_exist) {
      rewardHistory = await this.rewardHistoryRepository.findOne({
        where: { id, isActive: true, isDeleted: false },
        relations: ["user_id", "event_id", "referred_user_id", "referrer_id"],
      });
    } else {
      rewardHistory = await this.rewardHistoryRepository.findOne({
        where: { id },
        relations: ["user_id", "event_id", "referred_user_id", "referrer_id"],
      });
    }

    if (!rewardHistory) {
      return errorWithoutData("Reward history not found");
    }
    return successWithData("Reward history found", rewardHistory);
  }

  public async findRewardHistoryByUserId(
    id: string,
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const [rewardHistories, totalItems] =
      await this.rewardHistoryRepository.findAndCount({
        where: { user_id: { id: id }, ...whereCondition },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["user_id", "event_id", "referred_user_id", "referrer_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);

    return successWithData(`Reward history of user : ${id}`, rewardHistories, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }
  public async findRewardHistoryByUserIdTotal(id: string, verifyUser: any) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const [rewardHistories, totalItems] =
      await this.rewardHistoryRepository.findAndCount({
        where: { user_id: { id: id }, ...whereCondition },
        order: { createdAt: "DESC" },
        relations: ["user_id", "event_id", "referred_user_id", "referrer_id"],
      });
    console.log(rewardHistories);

    return successWithData(`Reward history of user : ${id}`, {
      total: totalItems,
    });
  }

  public async createRewardHistory(
    data: { [key: string]: any },
    verifyUser: any
  ) {
    if (verifyUser.admin_exist) {
      return errorWithoutData("Only users can create reward histories");
    }

    if (data.user_id != verifyUser.user_exist.id) {
      return errorWithoutData("User ID must match the authenticated user");
    }

    if (!data.event_id && !data.referred_user_id && !data.referrer_id) {
      return errorWithoutData("Event ID or Referred User ID are required");
    }

    const referred_user = await this.userReferralCodeRepository.findOne({
      where: { user_id: { id: data.referred_user_id } },
      relations: ["user_id"],
    });

    if (!referred_user || referred_user.user_id == verifyUser.user_exist) {
      return errorWithoutData("Referred User ID not found");
    }

    const history = await this.rewardHistoryRepository.findOne({
      where: {
        user_id: { id: verifyUser.user_exist.id },
        description: "Referral Coins added",
      },
      relations: ["user_id"],
    });

    if (history) {
      return errorWithoutData("Referral code has already been redeemed");
    }

    const newRewardHistory = this.rewardHistoryRepository.create(data);
    const savedRewardHistory = await this.rewardHistoryRepository.save(
      newRewardHistory
    );
    return successWithData(
      "Reward history created successfully",
      savedRewardHistory
    );
  }

  public async updateRewardHistory(
    id: string,
    data: { [key: string]: any },
    verifyUser: any
  ) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Only admin can update reward histories");
    }

    const rewardHistory = await this.rewardHistoryRepository.findOneBy({
      id,
      isActive: true,
      isDeleted: false,
    });
    if (!rewardHistory) {
      return errorWithoutData("Reward history not found");
    }
    await this.rewardHistoryRepository.update(id, data);
    return successWithoutData("Reward history updated successfully");
  }

  public async deleteRewardHistory(id: string, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Only admin can delete reward histories");
    }

    const rewardHistory = await this.rewardHistoryRepository.findOne({
      where: { id, isActive: true, isDeleted: false },
    });
    if (!rewardHistory) {
      return errorWithoutData("Reward history not found");
    }

    rewardHistory.isActive = false;
    rewardHistory.isDeleted = true;
    await this.rewardHistoryRepository.save(rewardHistory);
    return successWithoutData("Reward history deleted successfully");
  }
}
