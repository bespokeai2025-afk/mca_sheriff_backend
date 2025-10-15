// src/services/EmailService.ts
import nodemailer from "nodemailer";
import { AppDataSource } from "../config/database";
import { EmailLog } from "../entities/emailLog";

export class EmailService {
  private emailRepo = AppDataSource.getRepository(EmailLog);

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  public async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }) {
    const log = this.emailRepo.create({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      body: data.body,
      sent: false,
    });

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        html: data.body,
      });

      log.sent = true;
      await this.emailRepo.save(log);

      return { success: true, message: "Email sent successfully", data: log };
    } catch (error: any) {
      log.sent = false;
      log.error = error.message;
      await this.emailRepo.save(log);

      return { success: false, message: "Failed to send email", error: error.message };
    }
  }
}
