/**
 * Controller for handling event registration related operations
 * Handles CRUD operations for event registrations
 */

import { Request, Response } from "express";
import { EventRegistrationService } from "../services/eventRegistration.service";
import { errorWithData } from "../config/ApiResponse";

const eventRegistrationService = new EventRegistrationService();


/**
 * Register a user for an event
 * @param req - Express request object with registration data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const registerUserForEvent = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.registerUser(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get all event registrations
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all registrations or error
 */
export const getAllRegistrations = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getAllRegistrations(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAllRegistrationsByEventId = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getAllRegistrationsByEventId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAllRegistrationsByUserId = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getAllRegistrationsByUserId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAllRegistrationIdsByUserId = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getAllRegistrationIdsByUserId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const getAllRegistrationsByUserIdWithattendance = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await eventRegistrationService.getAllRegistrationsByEventIdUserIdWithattendace(
            req.query.event_id as string,
            req.query.user_id as string,
            req.verifyUser,
            parseInt(req.query.pageSize as string) || 50,
            parseInt(req.query.currentPage as string) || 1
        );
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


export const getAllRegistrationsByEventIdUserId = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getAllRegistrationsByEventIdUserId(req.query.event_id as string, req.query.user_id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get event registration by ID
 * @param req - Express request object with registration ID in params
 * @param res - Express response object
 * @returns JSON response with the registration or error
 */
export const getRegistrationById = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.getRegistrationById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Cancel an event registration
 * @param req - Express request object with registration ID in params and cancellation data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const cancelRegistration = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.cancelRegistration(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete an event registration
 * @param req - Express request object with registration ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteRegistration = async (req: Request, res: Response): Promise<any> => {

    try {
        const response = await eventRegistrationService.deleteRegistration(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
