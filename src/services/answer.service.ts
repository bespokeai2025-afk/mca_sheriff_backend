import { Answer } from "../entities/Answer";
import { successWithData, successWithoutData, errorWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Skill } from "../entities/Skills";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import { deleteUserToken } from "../utils/jwtUtils";

export class AnswerService {
    private answerRepository = AppDataSource.getRepository(Answer);
    private userRepository = AppDataSource.getRepository(User);
    private skillRepository = AppDataSource.getRepository(Skill);
    private adminRepository = AppDataSource.getRepository(Admin);

    public async findAnswers(verifyUser: any, pageSize: number, currentPage: number) {

        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }

        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }

        const [answers, totalItems] = await this.answerRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ['user_id', 'main_category_id']
        });

        let all_ans: any = [];

        all_ans = await Promise.all(answers.map(async (ans: any) => {
            const skills = await Promise.all(ans.skill_ids.map(async (skill_id: string) => {
                const skill: any = await this.skillRepository.findOne({
                    where: { id: skill_id },
                    relations: ['main_category_id']
                });
                return { skill_id: skill.id, skill_name: skill.name };
            }));

            return {
                id: ans.id, user_id: ans.user_id.id, user_name: ans.user_id.name, user_mobile: ans.user_id.mobile, user_email: ans.user_id.email, main_category_id: ans.main_category_id.id, main_category_name: ans.main_category_id.name, skills: skills
            };
        }));


        const totalPages = Math.ceil(totalItems / pageSize);

        if ( totalItems >= 1 && totalPages < currentPage) {
            return errorWithoutData('Page limit exceeded');
        }

        return successWithData("answers data", all_ans, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    public async findAnswerById(id: string, verifyUser: any) {

        let ans: any = null;
        if (verifyUser.admin_exist) {

            ans = await this.answerRepository.findOne({ where: { id }, relations: ['user_id', 'main_category_id'] });
        } else {
            ans = await this.answerRepository.findOne({ where: { id, isActive: true, isDeleted: false }, relations: ['user_id', 'main_category_id'] });
        }

        let all_ans: any = {};

        const skills = await Promise.all(ans.skill_ids.map(async (skill_id: string) => {
            const skill: any = await this.skillRepository.findOne({
                where: { id: skill_id },
                relations: ['main_category_id']
            });
            return { skill_id: skill.id, skill_name: skill.name };
        }));

        all_ans = {
            id: ans.id, user_id: ans.user_id.id, user_name: ans.user_id.name, main_category_id: ans.main_category_id.id, main_category_name: ans.main_category_id.name, skills: skills
        };


        if (!ans) return errorWithoutData('answer not found');

        return successWithData("answer found", all_ans);
    }

    public async createAnswer(data: { [key: string]: any }, verifyUser: any) {

        if (verifyUser.admin_exist) {
            return errorWithoutData('Only users can create answers');
        }


        const user = await this.userRepository.findOneBy({ id: verifyUser.user_exist.id })
        if (!user) return errorWithoutData('User not found');
        if (user.is_answer_submitted) return successWithoutData("Answer already submitted.")
        // Validate UUIDs
        if (!data.user_id || !data.main_category_id || !Array.isArray(data.skill_ids)) {
            return errorWithoutData("Invalid input data");
        }

        // Fetch existing skills from DB
        const skillRepository = AppDataSource.getRepository(Skill);
        const skills = await skillRepository.findByIds(data.skill_ids);

        if (skills.length !== data.skill_ids.length) {
            return errorWithoutData("Some skills not found");
        }

        const main_cate_id = data.main_category_id
        delete data.main_category_id

        data = { ...data, main_category_id: { id: main_cate_id } }

        await this.userRepository.update({ id: verifyUser.user_exist.id }, { is_answer_submitted: true })
        const newAnswer = await this.answerRepository.create(data);
        const answer = await this.answerRepository.save(newAnswer);
        return successWithoutData('Skills Submitted successfully');
    }

    public async updateAnswer(id: string, data: { [key: string]: any }, verifyUser: any) {
        if (verifyUser.admin_exist) {
            return errorWithoutData('Only users can update answers');
        }
        const answer = await this.answerRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!answer) return errorWithoutData('answer not found');
        await this.answerRepository.update(id, data);
        return successWithoutData('answer updated successfully');
    }

    public async deleteAnswer(id: string, verifyUser: any) {

        if (verifyUser.admin_exist) {
            return errorWithoutData('Only users can delete answers');
        }

        const answer = await this.answerRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!answer) return errorWithoutData('answer not found');
        answer.isDeleted = true;
        answer.isActive = false;

        await this.answerRepository.save(answer);
        return successWithoutData("answer deleted Successfully");
    }
}