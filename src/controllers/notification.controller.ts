// controllers/NotificationController.ts
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getNotificationById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
export const getNotificationByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findByUserId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
export const getNotificationByEventId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findByEventId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
export const getNotificationByTypeId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findByTypeId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getNotificationByUserIdEventId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findByUserIdEventId(req.query.user_id as string, req.query.event_id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getNotificationByUserIdEventIdTypeId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.findByUserIdEventIdTypeId(req.query.user_id as string, req.query.event_id as string, req.query.type_id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.create(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

export const updateNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};