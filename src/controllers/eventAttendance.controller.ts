/**
 * Controller for handling event attendance related operations
 * Handles CRUD operations for event attendance records
 */

import { Request, Response } from "express";
import { EventAttendanceService } from "../services/eventAttendance.service";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";

const attendanceService = new EventAttendanceService();
const adminRepository = AppDataSource.getRepository(Admin);

/**
 * Get all attendance records
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all attendance records or error
 */
export const getAllAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await attendanceService.getAllAttendance(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get attendance record by ID
 * @param req - Express request object with attendance ID in params
 * @param res - Express response object
 * @returns JSON response with the attendance record or error
 */
export const getAttendanceById = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.getAttendanceById(req.query.id as string, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAttendanceByEventId = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.getAttendanceByEventId(req.query.id as string, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAttendanceByUserId = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.getAttendanceByUserId(req.query.id as string, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAttendanceByEventIdByUserId = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.getAttendanceByEventIdByUserId(req.query.event_id as string, req.query.user_id as string, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Mark attendance for an event
 * @param req - Express request object with attendance data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const markAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.markAttendance(req.body, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const markAllAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }


        const users = req.body.users;

        users.map(async (user: any) => {
            const resp = await attendanceService.markAttendance({ user_id: user, event_id: req.body.event_id, marked_by: req.body.marked_by }, req.verifyUser);
        })

        const response = successWithoutData("Attendance marked successfully")

        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an attendance record
 * @param req - Express request object with attendance ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.updateAttendance(req.params.id, req.body, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Revoke an attendance record
 * @param req - Express request object with attendance ID in params and revoker info in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const revokeAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.revokeAttendance(req.params.id, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete an attendance record
 * @param req - Express request object with attendance ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteAttendance = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await attendanceService.deleteAttendance(req.params.id, req.verifyUser);
        return res.status(200).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
