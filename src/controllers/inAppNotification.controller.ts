import { Request, Response } from 'express';
import { InappNotificationService } from '../services/InAppNotification.service';

const inappNotificationService = new InappNotificationService();

export const getinappNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getinappNotificationById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createinappNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.create(req.body);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateinappNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteinappNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};


export const createTopicinappNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.createTopicinappNotification(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createBatchinappNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await inappNotificationService.createBatchinappNotification(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};