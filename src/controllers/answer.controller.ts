import { Request, Response } from "express";
import { errorWithData } from "../config/ApiResponse";
import { AnswerService } from "../services/answer.service";


const answerService = new AnswerService();

export const getAnswers = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await answerService.findAnswers(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData('something went wrong', { error });
    }
};

export const getAnswerById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await answerService.findAnswerById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("something went wrong", { error });
    }
};

export const createAnswer = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await answerService.createAnswer(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("something went wrong", { error });
    }
};

export const updateAnswer = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await answerService.updateAnswer(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("something went wrong", { error });
    }
};

export const deleteAnswer = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await answerService.deleteAnswer(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("something went wrong", { error });
    }
};
