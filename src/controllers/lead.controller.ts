// src/controllers/lead.controller.ts

import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";
import { webhookLogger } from "../logger/logger";

const leadService = new LeadService();

export class LeadController {

  async createLead(req: Request, res: Response) {
    const tag = "[POST /lead/create]";

    // ── Step 1: Log raw incoming request ────────────────────────────────────
    webhookLogger.info(`${tag} Incoming request`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      headers: {
        "content-type": req.headers["content-type"],
        origin: req.headers["origin"],
        "user-agent": req.headers["user-agent"],
      },
      rawBody: req.body,
    });

    try {
      const body = req.body;

      // ── Step 2: Normalize field names from WordPress form plugins ──────────
      const fullName =
        body.fullName ||
        body.full_name ||
        body["your-name"] ||
        body.name ||
        body.Name ||
        "";

      const phone =
        body.phone ||
        body.Phone ||
        body.phone_number ||
        body["your-phone"] ||
        body.mobile ||
        body.Mobile ||
        "";

      const email =
        body.email ||
        body.Email ||
        body["your-email"] ||
        body.email_address ||
        "";

      const fundingAmount =
        body.fundingAmount ||
        body.funding_amount ||
        body.amount_requested ||
        body.amount ||
        body.Amount ||
        undefined;

      const promoCode =
        body.promoCode ||
        body.promo_code ||
        body.coupon ||
        body.referral ||
        undefined;

      // ── Step 3: Log normalized fields ─────────────────────────────────────
      webhookLogger.info(`${tag} Normalized fields`, {
        fullName,
        phone,
        email,
        fundingAmount,
        promoCode,
      });

      if (!fullName || !phone) {
        webhookLogger.warn(`${tag} Validation failed — missing fullName or phone`, {
          fullName,
          phone,
          receivedKeys: Object.keys(body),
        });
        return res.status(400).json({
          success: false,
          message: "Full name and phone are required",
          debug: {
            receivedKeys: Object.keys(body),
            hint: "Send 'name'/'fullName' and 'phone'/'mobile' fields",
          },
        });
      }

      const lead = await leadService.createLead({
        fullName,
        phone,
        email,
        fundingAmount: fundingAmount ? Number(fundingAmount) : undefined,
        promoCode,
      });

      // ── Step 4: Log success ───────────────────────────────────────────────
      webhookLogger.info(`${tag} Lead created successfully`, {
        leadId: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
      });

      return res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: lead,
      });

    } catch (error: any) {
      // ── Step 5: Log error ─────────────────────────────────────────────────
      webhookLogger.error(`${tag} Error creating lead`, {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLeads(req: Request, res: Response) {
    try {
      const leads = await leadService.getAllLeads();

      return res.status(200).json({
        success: true,
        data: leads,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLeadById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lead = await leadService.getLeadById(id);
      return res.status(200).json({ result: true, data: lead });
    } catch (error: any) {
      const status = error.message === "Lead not found" ? 404 : 500;
      return res.status(status).json({ result: false, message: error.message });
    }
  }

  async getLeadsDashboard(req: Request, res: Response) {
    try {
      const page     = Number(req.query.page)     || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const response = await leadService.getLeadsDashboard(page, pageSize);
      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(500).json({
        result: false,
        message: error.message,
        data: null,
      });
    }
  }

  async deleteLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await leadService.deleteLead(id);
      return res.status(200).json({
        result: true,
        message: "Lead deleted successfully",
        data: result,
      });
    } catch (error: any) {
      const status = error.message === "Lead not found" ? 404 : 500;
      return res.status(status).json({
        result: false,
        message: error.message,
        data: null,
      });
    }
  }
}