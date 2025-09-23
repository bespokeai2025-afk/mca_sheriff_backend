import { Feedback } from "../entities/Feedback";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { UserService } from "./user.service";
import { User } from "../entities/User";

export class FeedbackService {
    private feedbackRepository = AppDataSource.getRepository(Feedback);
    private userRepository = AppDataSource.getRepository(User);

    public async findFeedbacks(verifyUser: any, pageSize: number, currentPage: number) {
    
        const [feedbacks, totalItems] = await this.feedbackRepository.findAndCount({
            where: {isDeleted: false},
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user_id']
        });

        const totalPages = Math.ceil(totalItems / pageSize);
        return successWithData("All feedbacks", feedbacks, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findFeedbackById(id: string) {
        const feedback = await this.feedbackRepository.findOne({ where: { id }, relations: ['user_id'] });
        if (!feedback) {
            return errorWithoutData('Feedback not found');
        }
        return successWithData("Feedback found", feedback);
    }

    public async findFeedbackByUserId(id: string) {
        const feedback = await this.feedbackRepository.findOne({ where: { user_id: { id: id } }, relations: ['user_id'] });
        if (!feedback) {
            return errorWithoutData('Feedback not found');
        }
        return successWithData("Feedback found", feedback);
    }

    public async createFeedback(data: { [key: string]: any }, verifyUser: any) {
        if (verifyUser.admin_exist) {
            return errorWithoutData('Only users can create feedback');
        }

        const userService = new UserService()

        const user: any = await userService.findUserById(verifyUser.user_exist.id, verifyUser)

        const user_id = user.data;

        // if (user_id.is_feedback_submitted) return errorWithoutData('Feedback already submitted')

        const newFeedback = this.feedbackRepository.create({ ...data, user_id: { id: verifyUser.user_exist.id } });

        user_id.is_feedback_submitted = true
        const feedback = await this.feedbackRepository.save(newFeedback);
        await this.userRepository.save(user_id);
        return successWithData('Feedback created successfully', feedback);
    }

    public async deleteFeedback(id: string) {
        const feedback = await this.feedbackRepository.findOneBy({ id });
        if (!feedback) {
            return errorWithoutData('Feedback not found');
        }

        feedback.isDeleted = true;
        feedback.isActive = false;

        await this.feedbackRepository.save(feedback);

        return successWithoutData("Feedback deleted successfully");
    }
}