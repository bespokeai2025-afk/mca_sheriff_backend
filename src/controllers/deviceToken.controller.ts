import { Request, Response } from 'express';
import { DeviceTokenService } from '../services/deviceToken.service';

const deviceTokenService = new DeviceTokenService();

export const getDeviceTokens = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.findAll(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getDeviceTokenById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.findById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
export const getDeviceTokenByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.findByUserId(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createDeviceToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.create(req.body, req.verifyUser);
        return res.status(response.result ? 201 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateDeviceToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.update(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteDeviceToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await deviceTokenService.delete(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};