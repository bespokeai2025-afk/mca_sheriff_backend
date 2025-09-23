/**
 * Service for handling Survey_answers business logic
 * Handles database operations and business rules for   categories
 */

import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";
import { Survey_questions } from "../entities/Survey_questions";
// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Survey_answers } from "../entities/Survey_answers";



export class Survey_answersService {
    // Repository for Survey_answers database operations


    private Survey_answersRepository = AppDataSource.getRepository(Survey_answers);
    private Survey_questions = AppDataSource.getRepository(Survey_questions);

    /**
     * Get all active   categories
     * @returns Promise with success response containing categories or error response
     */
    public async getSurvey_answers(isActive: boolean | undefined
        , verifyUser: any, pageSize: number, currentPage: number) {


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

        const [ Categories, totalItems] = await this.Survey_answersRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });


        const totalPages = Math.ceil(totalItems / pageSize);

        if (currentPage > totalPages) {
            currentPage = totalPages; // Default to the last available page
        }

        return successWithData("Survey_answers data ",  Categories, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    }

    /**
     * Find a Survey_answers by ID
     * @param id - The ID of the Survey_answers to find
     * @returns Promise with success response containing the Survey_answers or error response if not found
     */
    public async findSurvey_answersById(id: string, verifyUser: any) {

        let Survey_answers = null;
        if (verifyUser.admin_exist) {
            Survey_answers = await this.Survey_answersRepository.findOne({ where: { id: id, isDeleted: false } })
        } else {
            Survey_answers = await this.Survey_answersRepository.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!Survey_answers) {
            return errorWithoutData('Survey_answers not found')
        }

        return successWithData("Survey_answers found", Survey_answers);
    }

    /**
     * Create a new Survey_answers
     * @param Data - Object containing Survey_answers data
     * @returns Promise with success response containing the created Survey_answers or error response
     */
    public async createSurvey_answers(data: Partial<Survey_answers>, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create Survey_answers')
        }

        if ("question_id" in data && typeof data.question_id === "string") {
            const eventTypeExists = await this.Survey_questions.findOneBy({
                id: String(data.question_id).trim(),
                isDeleted: false,
                isActive: true
            });
        
            if (!eventTypeExists) {
                return errorWithoutData("question_id does not exist");
            }
        
          
        
            data.question = eventTypeExists; // Correct way to assign entity
        }
        
        if ("next_id" in data && typeof data.next_id === "string") {
            const eventTypeExists = await this.Survey_questions.findOneBy({
                id: String(data.next_id).trim(),
                isDeleted: false,
                isActive: true
            });
        
            if (!eventTypeExists) {
                return errorWithoutData("next_id does not exist");
            }
        
          
        
            data.nextQuestion = eventTypeExists; // Correct way to assign entity
        }
        

        const newSurvey_answers = await this.Survey_answersRepository.create(data)

        const Survey_answers = await this.Survey_answersRepository.save(newSurvey_answers)

        if (!Survey_answers) {
            return errorWithoutData('Survey_answers not created')
        }
        return successWithData("Survey_answers created successfully", Survey_answers);

    }

    /**
     * Update an existing Survey_answers
     * @param id - The ID of the Survey_answers to update
     * @param Data - Object containing updated Survey_answers data
     * @returns Promise with success response or error response
     */
    public async updateSurvey_answers(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update Survey_answers')
        }

        const Survey_answers = await this.Survey_answersRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!Survey_answers) {
            return errorWithoutData('Survey_answers not found')
        }



        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.Survey_answersRepository.update(id.toString(), updatedData);
        return successWithoutData('Survey_answers updated successfully');

    }

    /**
     * Soft delete a Survey_answers
     * @param id - The ID of the Survey_answers to delete
     * @returns Promise with success response or error response
     */

    public async deleteSurvey_answers(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update deleteSurvey_answers")
        }
        const Survey_answers = await this.Survey_answersRepository.findOneBy({ id });

        if (!Survey_answers) {
            return errorWithoutData("  Survey_answers  not found");
        }

        Survey_answers.isDeleted = true; // Mark as soft deleted
        await this.Survey_answersRepository.save(Survey_answers);

        return successWithoutData("  Survey_answers  soft deleted successfully");
    }
    public async activeSurvey_answers(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update activeSurvey_answers")
        }
        const Survey_answers = await this.Survey_answersRepository.findOneBy({ id });

        if (!Survey_answers) {
            return errorWithoutData("Survey_answers  not found");
        }

        Survey_answers.isActive = !Survey_answers.isActive; // Mark as deleted
        await this.Survey_answersRepository.save(Survey_answers);

        return successWithoutData("Survey_answers  dectivetd successfully");
    }
}
