import { Request, Response } from "express";
import { errorWithData, errorWithoutData, successWithData } from "../config/ApiResponse";
import { LeadFilterMasterService } from "../services/leadFilterMaster.service";

const leadFilterService = new LeadFilterMasterService();

/**
 * Get all lead filters with pagination and optional search
 */
export const getLeadFilters = async (req: Request, res: Response): Promise<any> => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const currentPage = parseInt(req.query.currentPage as string) || 1;
    const search = req.query.search as string | undefined;

    const response = await leadFilterService.getLeadFilters(pageSize, currentPage, search);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(500).json(response);
  }
};

/**
 * Get single lead filter by ID
 */
export const getLeadFilterById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const response = await leadFilterService.getLeadFilterById(id);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(500).json(response);
  }
};

/**
 * Create new lead filter
 */
export const createLeadFilter = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = req.body;
    const response = await leadFilterService.createLeadFilter(data);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(500).json(response);
  }
};

/**
 * Update lead filter by ID
 */
export const updateLeadFilter = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const data = req.body;
    const response = await leadFilterService.updateLeadFilter(id, data);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(500).json(response);
  }
};

/**
 * Soft delete lead filter by ID
 */
export const deleteLeadFilter = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const response = await leadFilterService.deleteLeadFilter(id);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    const response = errorWithData("Something went wrong", { error });
    return res.status(500).json(response);
  }
};
