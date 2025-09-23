import { Request, Response } from 'express';
import { NotificationReadReceiptService } from '../services/notificationReadReceipt.service';

const notificationReadReceiptService = new NotificationReadReceiptService();

export const getNotificationReadReceipts = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationReadReceiptService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getNotificationReadReceiptById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationReadReceiptService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createNotificationReadReceipt = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationReadReceiptService.create(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateNotificationReadReceipt = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationReadReceiptService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteNotificationReadReceipt = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await notificationReadReceiptService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};