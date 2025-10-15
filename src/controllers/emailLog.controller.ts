// src/controllers/EmailController.ts
import { Request, Response } from "express";
import { EmailService } from "../services/emailLog.service";

const emailService = new EmailService();

export class EmailController {
  public static async sendEmail(req: Request, res: Response) {
    try {
      const { to, subject, body, cc, bcc } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ success: false, message: "to, subject, and body are required" });
      }

      const result = await emailService.sendEmail({ to, subject, body, cc, bcc });
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ success: false, message: "Internal server error", error });
    }
  }
}
