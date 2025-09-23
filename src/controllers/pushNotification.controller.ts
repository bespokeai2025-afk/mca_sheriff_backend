import { Request, Response } from 'express';
import { PushNotificationService } from '../services/pushNotification.service';

const pushNotificationService = new PushNotificationService();

export const getPushNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getPushNotificationById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createPushNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.create(req.body);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updatePushNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deletePushNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};


export const createTopicPushNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.createTopicPushNotification(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createBatchPushNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await pushNotificationService.createBatchPushNotification(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};