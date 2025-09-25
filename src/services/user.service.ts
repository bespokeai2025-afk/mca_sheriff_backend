import { Admin } from "../entities/Admin";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { deleteUserToken } from "../utils/jwtUtils";
import { sendEmail } from "../config/mailer";
// import { NotificationService } from "./notification.service";
// import { profileCompletionQueue } from "../workers/notification.worker"

// const notificationService = new NotificationService();
export class UserService {

    private userRepository = AppDataSource.getRepository(User);
    private adminRepository = AppDataSource.getRepository(Admin);
    private eventRepository = AppDataSource.getRepository(Event);



    public async findUser(verifyUser: any, pageSize: number, currentPage: number) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service')
        }

        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }

        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }

        const [users, totalItems] = await this.userRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("Users data", users, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }


    public async countUsers(verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service');
        }

        let whereCondition = {};

        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }

        const totaluserCount = await this.userRepository.count({ where: whereCondition });
        const eventCount = await this.eventRepository.count({ where: whereCondition });
        const eventRepositorydata = await this.eventRepository.find({ where: whereCondition });
        return successWithData("Counts retrieved successfully", {
            totaluserCount,
            eventCount,
    
             eventRepositorydata
        });
    }

    public async findUserById(id: string, verifyUser: any) {


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

        return successWithData("user found", user);
    }
    public async findUserConfig(id: string, verifyUser: any) {


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
        let userEmailExist = false;
        if (user.email != null && user.email.length >= 5) {
            userEmailExist = true
        }
        // user_id: user.id, user_name: user.name, user_email: user.email, user_mobile: user.mobile,
        const config = { name: user?.name, mobile: user?.mobile, userEmailExist, userisEmailVerified: user.is_email_verified, isAnswerSubmitted: user.is_answer_submitted, isProfileCompleted: user.isProfileCompleted, is_feedback_submitted: user.is_feedback_submitted, isActive: user.isActive, isDeleted: user.isDeleted, email: user.email, isSurveySubmitted: user.is_survey_submitted }

        return successWithData("user found", config);
    }

    public async updateUser(id: string, userData: { [key: string]: any; }, verifyUser: any) {


        let user = null;

        if (verifyUser.admin_exist || verifyUser.user_exist) {
            user = await this.userRepository.findOneBy({ id });
        }
        if (!user) {
            return errorWithoutData('user not found')
        }

        if (userData.mobile) {
            const user_exist = await this.userRepository.findOneBy({ mobile: userData.mobile });
            if (user_exist) return errorWithoutData("mobile number is already registered")
        }

        if (userData.email) {
            const user_exist = await this.userRepository.findOneBy({ email: userData.email });
            if (user_exist) return errorWithoutData("email is already registered")
        }

        if (userData.email) {
            this.userRepository.update(id.toString(), { is_email_verified: false })
        }

        await this.userRepository.update(id.toString(), userData);
        console.log('intialize')

        // await profileCompletionQueue.add(
        //     'sendDelayedWelcomeNotification',
        //     {
        //         userId: user.id,
        //         message: `🔄 Your profile details have been successfully updated`,

        //     },
        //     {
        //         delay: 10 * 1000, // 1 minute delay
        //         attempts: 3,

        //     }
        // );
        console.log('intialize2')

        return successWithoutData('Your details have been successfully updated');
    }

    public async deleteUser(id: string, verifyUser: any) {

        let user = null;
        if (verifyUser.admin_exist || verifyUser.user_exist) {
            user = await this.userRepository.findOneBy({ id })
        }

        if (!user) {
            return errorWithoutData('user not found')
        }

        user.isDeleted = true;
        user.isActive = false;
        user.isProfileCompleted = false;

        deleteUserToken(user.id);

        await this.userRepository.save(user);

        return successWithoutData("user deleted Successfully")

    }
    public async logoutUser(id: string, verifyUser: any) {

        if (verifyUser.admin_exist) {
            return errorWithoutData('only user can use this service')
        }

        let user = null;
        if (verifyUser.user_exist) {
            user = await this.userRepository.findOneBy({ id })
        }

        if (!user) {
            return errorWithoutData('user not found')
        }
        deleteUserToken(user.id);
        await this.userRepository.save(user);
        return successWithoutData("user Logout Successfully")

    }

    public async verifyEmail(email: string, verifyUser: any) {

        if (verifyUser.admin_exist) {
            return errorWithoutData('only user can use this service')
        }

        let user = null;
        if (verifyUser.user_exist) {
            user = await this.userRepository.findOne({ where: { email: email } })
        }

        if (!user) {
            return errorWithoutData('user not found')
        }

        if (user.is_email_verified) return errorWithoutData("Email is already verified..")

        const link = `http://localhost:3000/auth/verify-email/${user.id}`
        try {
            await sendEmail(email, "Email Verification link", `verification link ${link}`);
        } catch (error) {
            return errorWithoutData("Error while sending email")
        }

        return successWithData("Email verification link sent successfully", { user_id: user.id, verification_url: link })

    }
    public async verifyEmailByLink(id: string) {

        let user = null;
        user = await this.userRepository.findOne({ where: { id: id } })

        if (!user) {
            return errorWithoutData('user not found')
        }

        if (user.is_email_verified) return errorWithoutData("Email is already verified..")


        await this.userRepository.update({ id: user.id }, { is_email_verified: true })

        return successWithoutData("Email verified Successfully")

    }





}
