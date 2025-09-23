import { AppDataSource } from "../config/database";
import { UserSurveyAnswers } from '../entities/User_Survey_Answers';
import { errorWithData, successWithData } from "../config/ApiResponse";
import { Survey_questions } from '../entities/Survey_questions';
import { Survey_answers } from '../entities/Survey_answers';
import { User } from '../entities/User';
import { In } from 'typeorm';



export class UserSurveyAnswersService {
    private UserSurveyAnswersRepository = AppDataSource.getRepository(UserSurveyAnswers);
    private Survey_questionsRepository = AppDataSource.getRepository(Survey_questions);
    private Survey_answersRepository = AppDataSource.getRepository(Survey_answers);
    private userRepository = AppDataSource.getRepository(User);

    /**
     * Create a new survey answer record
     */
    public async createBulkSurveyAnswers(userId: string, responses: { question_id: string, answer_id: string }[]) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) return errorWithData("User not found", { userId });

            const surveyAnswers = [];

            for (const response of responses) {
                const question = await this.Survey_questionsRepository.findOne({ where: { id: response.question_id } });
                if (!question) return errorWithData("Question not found", { question_id: response.question_id });

                const answer = await this.Survey_answersRepository.findOne({ where: { id: response.answer_id } });
                if (!answer) return errorWithData("Answer not found", { answer_id: response.answer_id });

                const surveyAnswer = this.UserSurveyAnswersRepository.create({ user, question, answer });
                surveyAnswers.push(surveyAnswer);
            }

            await this.UserSurveyAnswersRepository.save(surveyAnswers);

            return successWithData("Thanks! Your responses have been saved.", surveyAnswers);
        } catch (error) {
            return errorWithData("Failed to record survey answers", { error });
        }
    }


    public async createSurveyAnswers(userId: string, responses: { question_id: string, answer_id: string }[]) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) return errorWithData("User not found", { userId });

            const surveyAnswers = [];

            for (const { question_id, answer_id } of responses) {

                const question = await this.Survey_questionsRepository.findOne({ where: { id: question_id } });
                if (!question) return errorWithData("Question not found", { question_id });

                const answer = await this.Survey_answersRepository.findOne({ where: { id: answer_id } });
                if (!answer) return errorWithData("Answer not found", { answer_id });

                const surveyAnswer = this.UserSurveyAnswersRepository.create({
                    user,
                    question,
                    answer
                });

                console.log(`Saving: ${JSON.stringify(surveyAnswer)}`);
                surveyAnswers.push(surveyAnswer);
            }

            await this.UserSurveyAnswersRepository.save(surveyAnswers);
            user.survey = true;
            user.is_survey_submitted = true; // Set the survey submitted flag to true
            await this.userRepository.save(user);
            return successWithData("Thanks! Your responses have been saved.", surveyAnswers);
        } catch (error) {
            return errorWithData("Failed to create survey answers", { error });
        }
    }







    /**
     * Get all survey answers with user, question, and answer details
     */
    // public async getSurveyAnswers() {
    //     try {
    //         const surveyAnswers = await this.UserSurveyAnswersRepository.find({
    //             relations: ['user', 'question', 'answer'],
    //             order: { id: 'ASC' },
    //         });

    //         if (!surveyAnswers.length) {
    //             return errorWithData("No survey answers found", {});
    //         }

    //         // Explicitly define the type for groupedData
    //         const groupedData: Record<string, { user: User; responses: { question: string; answer: string }[] }> = {};

    //         surveyAnswers.forEach(sa => {
    //             const userId = sa.user.id;

    //             if (!groupedData[userId]) {
    //                 groupedData[userId] = {
    //                     user: sa.user,
    //                     responses: []
    //                 };
    //             }

    //             groupedData[userId].responses.push({
    //                 question: sa.question.question_text, // Ensure this field exists in Survey_questions
    //                 answer: sa.answer.answer_text // Ensure this field exists in Survey_answers
    //             });
    //         });

    //         const formattedData = {
    //             result: true,
    //             message: "Survey answers retrieved successfully",
    //             data: Object.values(groupedData) // Convert object to array
    //         };

    //         return successWithData("Survey answers retrieved successfully", formattedData);
    //     } catch (error) {
    //         return errorWithData("Failed to fetch survey answers", { error });
    //     }
    // }
    public async getSurveyAnswers(user: any, pageSize: number = 10, currentPage: number=1) {
        try {
            // Step 1: Get total unique user count
            const totalItemsResult = await this.UserSurveyAnswersRepository
                .createQueryBuilder("usa")
                .leftJoin("usa.user", "user")
                .select("COUNT(DISTINCT user.id)", "count")
                .getRawOne();

            const totalItems = parseInt(totalItemsResult.count, 10);
            const totalPages = Math.ceil(totalItems / pageSize);

            if (totalItems === 0) {
                return errorWithData("No survey answers found", {
                    surveyAnswers: [],
                    pagination: { totalItems: 0, totalPages: 0, currentPage, pageSize }
                });
            }

            // Step 2: Get paginated user IDs
            const userIdsResult = await this.UserSurveyAnswersRepository
                .createQueryBuilder("usa")
                .leftJoin("usa.user", "user")
                .select("DISTINCT user.id", "id")
                .orderBy("user.id", "DESC")
                .offset((currentPage - 1) * pageSize)
                .limit(pageSize)
                .getRawMany();

            const userIds = userIdsResult.map(row => row.id);

            if (!userIds.length) {
                return errorWithData("No user survey answers found on this page", {});
            }

            // Step 3: Fetch all survey answers for selected users
            const surveyAnswers = await this.UserSurveyAnswersRepository.find({
                where: { user: In(userIds) },
                relations: ['user', 'question', 'answer'],
                order: { id: 'DESC' }
            });

            // Step 4: Group answers by user
            const groupedData: Record<string, { user: User; responses: { question: string; answer: string }[] }> = {};

            surveyAnswers.forEach(sa => {
                const userId = sa.user.id;

                if (!groupedData[userId]) {
                    groupedData[userId] = {
                        user: sa.user,
                        responses: []
                    };
                }

                groupedData[userId].responses.push({
                    question: sa.question.question_text,
                    answer: sa.answer.answer_text
                });
            });

            const formattedData = {
                surveyAnswers: Object.values(groupedData),
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage,
                    pageSize
                }
            };

            return successWithData("Survey answers retrieved successfully", formattedData);
        } catch (error) {
            return errorWithData("Failed to fetch survey answers", { error });
        }
    }


    /**
     * Get a single survey answer by ID
     */
    public async getSurveyAnswerById(id: string) {
        try {
            const surveyAnswer = await this.UserSurveyAnswersRepository.findOne({
                where: { id: id },
                relations: ['user', 'question', 'answer'],
            });

            if (!surveyAnswer) return errorWithData("Survey answer not found", { id });

            return successWithData("Survey answer fetched successfully", surveyAnswer);
        } catch (error) {
            return errorWithData("Failed to fetch survey answer", { error });
        }
    }

    /**
     * Update a survey answer
     */
    public async updateSurveyAnswer(id: string, answerId: string) {
        try {
            const surveyAnswer = await this.UserSurveyAnswersRepository.findOneBy({ id });
            if (!surveyAnswer) return errorWithData("Survey answer not found", { id });

            const answer = await this.Survey_answersRepository.findOne({ where: { id: answerId } });
            if (!answer) return errorWithData("Answer not found", { answerId });

            surveyAnswer.answer = answer;
            await this.UserSurveyAnswersRepository.save(surveyAnswer);

            return successWithData("Survey answer updated successfully", surveyAnswer);
        } catch (error) {
            return errorWithData("Failed to update survey answer", { error });
        }
    }

    /**
     * Delete a survey answer by ID
     */
    public async deleteSurveyAnswer(id: string) {
        try {
            const surveyAnswer = await this.Survey_answersRepository.findOneBy({ id });
            if (!surveyAnswer) return errorWithData("Survey answer not found", { id });

            surveyAnswer.isDeleted = true; // Soft delete
            await this.Survey_answersRepository.save(surveyAnswer);

            return successWithData("Survey answer soft deleted successfully", { id });
        } catch (error) {
            return errorWithData("Failed to delete survey answer", { error });
        }
    }

    public async getSurveyAnswersByUserId(userId: string) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) return errorWithData("User not found", { userId });

            const surveyAnswers = await this.UserSurveyAnswersRepository.find({
                where: { user: { id: userId } },
                relations: ['question', 'answer']
            });

            if (!surveyAnswers.length) return errorWithData("No survey answers found", { userId });

            // Format the response
            const formattedResponse = {
                user_id: user,
                responses: surveyAnswers.map(surveyAnswer => ({
                    question: surveyAnswer.question.question_text, // Adjust based on actual column name
                    answer: surveyAnswer.answer.answer_text // Adjust based on actual column name
                }))
            };

            return successWithData("Survey answers retrieved successfully", formattedResponse);
        } catch (error) {
            return errorWithData("Failed to fetch survey answers", { error });
        }
    }

    // public async getAllQuestionsWithAnswers() {
    //     try {
    //         // Fetch all unique questions
    //         const questions = await this.Survey_questionsRepository.find({ relations: ['answers'] });

    //         if (!questions.length) return errorWithData("No questions found", {});

    //         // Format the response
    //         const formattedResponse = questions.map(question => ({
    //             question_id: question.id,
    //             question_text: question.question_text,
    //             category:question.category,
    //             answers: question.answers.map(answer => ({
    //                 answer_id: answer.id,
    //                 answer_text: answer.answer_text,
    //                 nextQuestion : answer.nextQuestion
    //             }))     
    //         }));

    //         return successWithData("Questions and answers retrieved successfully", formattedResponse);
    //     } catch (error) {
    //         return errorWithData("Failed to fetch questions", { error });
    //     }
    // }
    public async getAllQuestionsWithAnswers() {
        try {
            // Fetch all non-deleted questions with their answers and next questions
            const questions = await this.Survey_questionsRepository.find({
                where: { isDeleted: false },
                relations: ['answers', 'answers.nextQuestion'],
                order: {
                    serialNumber: 'ASC' // or 'DESC' if you want descending order
                }
            });

            if (!questions.length) {
                return errorWithData("No questions found", {});
            }

            // Flatten and extract unique categories
            const uniqueCategories = Array.from(new Set(questions.flatMap(q => q.category).flat()));

            // Format the response
            const formattedResponse = {
                types: {
                    category: uniqueCategories
                },
                questions: questions.map(question => ({
                    id: question.id,
                    question_text: question.question_text,
                    category: question.category,
                    serialNumber: question.serialNumber,
                    answers: question.answers
                        .filter(answer => !answer.isDeleted) // Only non-deleted answers
                        .map(answer => ({
                            id: answer.id,
                            answer_text: answer.answer_text,
                            next_question_id: answer.nextQuestion ? answer.nextQuestion.id : null
                        }))
                }))
            };

            return successWithData("Questions and answers retrieved successfully", formattedResponse);
        } catch (error) {
            return errorWithData("Failed to fetch questions", { error });
        }
    }


}

