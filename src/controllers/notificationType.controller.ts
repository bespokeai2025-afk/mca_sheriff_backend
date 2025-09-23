// controllers/NotificationTypeController.ts
import { Request, Response } from 'express';
import { NotificationTypeService } from '../services/notificationType.service';

const notificationTypeService = new NotificationTypeService();

export const getNotificationTypes = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationTypeService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getNotificationTypeById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationTypeService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createNotificationType = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationTypeService.create(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateNotificationType = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationTypeService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteNotificationType = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationTypeService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};