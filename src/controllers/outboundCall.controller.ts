import { Request, Response } from "express";
import { OutboundCallService } from "../services/outboundCall.service";
import { errorWithData } from "../config/ApiResponse";

const outboundCallService = new OutboundCallService();

/**
 * GET /outbound-call/start-calling
 * "Start Calling" button — initiates outbound calls for all leads
 * that don't have a completed outbound call.
 */
export const startBatchCalling = async (_req: Request, res: Response): Promise<any> => {
  try {
    const response = await outboundCallService.startBatchCalling();
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error in startBatchCalling controller:", error);
    return res
      .status(500)
      .json(errorWithData("Internal Server Error", { error: (error as Error).message }));
  }
};

/**
 * GET /outbound-call/list
 * Returns stats cards + paginated call table for the Outbound Calls UI.
 * Query params: page (default 1), pageSize (default 10)
 */
export const getOutboundCallsWithStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const page     = Number(req.query.page)     || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const response = await outboundCallService.getOutboundCallsWithStats(page, pageSize);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error in getOutboundCallsWithStats controller:", error);
    return res
      .status(500)
      .json(errorWithData("Internal Server Error", { error: (error as Error).message }));
  }
};

/**
 * POST /outbound-call/save
 * n8n posts the full Retell call_analyzed payload here after an outbound call ends.
 * Finds or creates lead, updates business info, upserts the call record.
 * No auth required (called by n8n automation).
 */
export const saveOutboundCallFromN8n = async (req: Request, res: Response): Promise<any> => {
  try {
    const response = await outboundCallService.saveOutboundCallFromN8n(req.body);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error in saveOutboundCallFromN8n controller:", error);
    return res
      .status(500)
      .json(errorWithData("Internal Server Error", { error: (error as Error).message }));
  }
};

/**
 * POST /outbound-call/webhook
 * Retell AI calls this when a call ends — updates call status and lead status.
 * No auth required (Retell calls this directly).
 */
export const outboundCallWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const response = await outboundCallService.handleCallWebhook(req.body);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in outboundCallWebhook controller:", error);
    return res
      .status(500)
      .json(errorWithData("Internal Server Error", { error: (error as Error).message }));
  }
};
