/**
 * Service for handling Survey_questions business logic
 * Handles database operations and business rules for main categories
 */

import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";

// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Survey_questions } from "../entities/Survey_questions";
import { Survey_answers } from "../entities/Survey_answers";


export class Survey_questions_Service {
    // Repository for Survey_questions database operations


    private Survey_questionsRepository = AppDataSource.getRepository(Survey_questions);
    private Survey_answersRepository = AppDataSource.getRepository(Survey_answers);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getSurvey_questions_withanswer(
        isActive: boolean | undefined,
        verifyUser: any,
        pageSize: number,
        currentPage: number
    ) {
        try {
            let whereCondition: any = {};

            if (verifyUser.user_exist) {
                whereCondition = { isActive: true, isDeleted: false };
            } else if (verifyUser.admin_exist) {
                whereCondition = { isDeleted: false };
            }

            if (isActive !== undefined) {
                whereCondition.isActive = isActive;
            }

            const [surveyQuestions, totalItems] = await this.Survey_questionsRepository.findAndCount({
                where: whereCondition,
                order: { createdAt: 'DESC' },
                skip: (currentPage - 1) * pageSize,
                take: pageSize,
            });

            const formattedQuestions = await Promise.all(
                surveyQuestions.map(async (question) => {
                    const answers = await this.Survey_answersRepository.find({
                        where: { question: { id: question.id } }
                    });
                    return {
                        id: question.id,
                        question_text: question.question_text,
                        category: question.category,
                        answers: answers.map(answer => ({
                            id: answer.id,
                            answer_text: answer.answer_text,
                            next_question_id: answer.nextQuestion ? answer.nextQuestion.id : null
                        }))
                    };
                })
            );

            const totalPages = Math.ceil(totalItems / pageSize);
            return successWithData("Survey questions data", formattedQuestions, {
                totalItems,
                totalPages,
                currentPage,
                pageSize,
            });
        } catch (error) {
            return errorWithData("Failed to fetch survey questions", { error });
        }
    }


    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getSurvey_questions(isActive: boolean | undefined, verifyUser: any, pageSize: number, currentPage: number) {


        const whereCondition: any = { isDeleted: false };

        // Apply filtering if isActive is provided
        if (isActive !== undefined) {
            whereCondition.isActive = isActive;
        }

        let whereCd = {};
        if (verifyUser.user_exist) {
            whereCd = { isActive: true, isDeleted: false };
        }

        if (verifyUser.admin_exist) {
            whereCd = { isDeleted: false };
        }

        const [mainCategories, totalItems] = await this.Survey_questionsRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });


        const totalPages = Math.ceil(totalItems / pageSize);

        if (currentPage > totalPages) {
            currentPage = totalPages; // Default to the last available page
        }

        return successWithData("Survey_questions data ", mainCategories, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }
    /**
     * Find a Survey_questions by ID
     * @param id - The ID of the Survey_questions to find
     * @returns Promise with success response containing the Survey_questions or error response if not found
     */
    public async findSurvey_questionsById(id: string, verifyUser: any) {

        let Survey_questions = null;
        if (verifyUser.admin_exist) {
            Survey_questions = await this.Survey_questionsRepository.findOne({ where: { id: id, isDeleted: false } })
        } else {
            Survey_questions = await this.Survey_questionsRepository.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!Survey_questions) {
            return errorWithoutData('Survey_questions not found')
        }

        return successWithData("Survey_questions found", Survey_questions);
    }

    /**
     * Create a new Survey_questions
     * @param Data - Object containing Survey_questions data
     * @returns Promise with success response containing the created Survey_questions or error response
     */
    public async createSurvey_questions(Data: object, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create Survey_questions')
        }

        const newSurvey_questions = await this.Survey_questionsRepository.create(Data)

        const Survey_questions = await this.Survey_questionsRepository.save(newSurvey_questions)

        if (!Survey_questions) {
            return errorWithoutData('Survey_questions not created')
        }
        return successWithData("Survey_questions created successfully", Survey_questions);

    }

    /**
     * Update an existing Survey_questions
     * @param id - The ID of the Survey_questions to update
     * @param Data - Object containing updated Survey_questions data
     * @returns Promise with success response or error response
     */
    public async updateSurvey_questions(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update Survey_questions')
        }

        const Survey_questions = await this.Survey_questionsRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!Survey_questions) {
            return errorWithoutData('Survey_questions not found')
        }



        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.Survey_questionsRepository.update(id.toString(), updatedData);
        return successWithoutData('Survey_questions updated successfully');

    }

    /**
     * Soft delete a Survey_questions
     * @param id - The ID of the Survey_questions to delete
     * @returns Promise with success response or error response
     */

    public async deleteSurvey_questions(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const Survey_questions = await this.Survey_questionsRepository.findOneBy({ id });

        if (!Survey_questions) {
            return errorWithoutData("Main Survey_questions  not found");
        }

        Survey_questions.isDeleted = true; // Mark as soft deleted
        await this.Survey_questionsRepository.save(Survey_questions);

        return successWithoutData(" Survey_questions  soft deleted successfully");
    }
    public async activeSurvey_questions(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const Survey_questions = await this.Survey_questionsRepository.findOneBy({ id });

        if (!Survey_questions) {
            return errorWithoutData("Survey_questions  not found");
        }

        Survey_questions.isActive = !Survey_questions.isActive; // Mark as deleted
        await this.Survey_questionsRepository.save(Survey_questions);

        return successWithoutData("Survey_questions  dectivetd successfully");
    }
}
