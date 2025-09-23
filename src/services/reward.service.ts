import { Reward } from "../entities/Reward";
import { AppDataSource } from "../config/database";
import { successWithData, errorWithoutData, successWithoutData } from "../config/ApiResponse";
import { deleteUserToken } from "../utils/jwtUtils";

export class RewardService {
    private rewardRepository = AppDataSource.getRepository(Reward);

    public async findRewards(verifyUser: any, pageSize: number, currentPage: number) {
        let whereCondition = {};
        if (verifyUser.user_exist) {
            return errorWithoutData("User cannot access this service");
        }
        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }

        const [rewards, totalItems] = await this.rewardRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("all Rewards", rewards, {
            totalItems,
            totalPages,
            currentPage,
            pageSize

        })
    }

    public async findRewardById(id: string) {
        const reward = await this.rewardRepository.findOneBy({ id });
        if (!reward) return errorWithoutData("Reward not found");
        return successWithData("Reward found", reward);
    }

    public async createReward(data: any, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("User cannot create reward");
        }
        const newReward = this.rewardRepository.create(data);
        const reward = await this.rewardRepository.save(newReward);
        return successWithData("Reward created successfully", reward);
    }

    public async updateReward(id: string, data: any, verifyToken: any) {
        if (verifyToken.user_exist) {
            return errorWithoutData("User cannot update reward");
        }
        const reward = await this.rewardRepository.findOneBy({ id, isDeleted: false });
        if (!reward) return errorWithoutData("Reward not found");
        await this.rewardRepository.update(id, data);
        return successWithoutData("Reward updated successfully");
    }

    public async deleteReward(id: string, verifyToken: any) {

        if (verifyToken.user_exist) {
            return errorWithoutData("User cannot delete reward");
        }
        const reward = await this.rewardRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!reward) return errorWithoutData("Reward not found");
        reward.isDeleted = true;
        reward.isActive = false;

        await this.rewardRepository.save(reward);
        return successWithoutData("Reward deleted successfully");
    }
}