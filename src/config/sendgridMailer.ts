import sgMail from "@sendgrid/mail";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3Bucket";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export interface NewLeadEmailData {
  fullName: string;
  phone: string;
  email?: string;
  fundingAmount?: number;
  promoCode?: string;
  createdAt?: Date;
}

export const sendNewLeadNotification = async (lead: NewLeadEmailData) => {
  const adminEmail = "ranjangyana259@gmail.com";
  const senderEmail = process.env.SENDER_MAIL || "rohit.hajare@invennico.com";

  const msg = {
    to: adminEmail,
    from: senderEmail,
    subject: "New Lead Added - MCA Sheriff Dashboard",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          New Lead Notification
        </h2>
        <p style="color: #555; font-size: 15px;">A new lead has been added to the MCA Sheriff Dashboard. Here are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px 14px; font-weight: bold; color: #333; width: 40%;">Full Name</td>
            <td style="padding: 10px 14px; color: #555;">${lead.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #333;">Phone</td>
            <td style="padding: 10px 14px; color: #555;">${lead.phone}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px 14px; font-weight: bold; color: #333;">Email</td>
            <td style="padding: 10px 14px; color: #555;">${lead.email || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #333;">Funding Amount</td>
            <td style="padding: 10px 14px; color: #555;">${lead.fundingAmount ? `$${lead.fundingAmount.toLocaleString()}` : "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px 14px; font-weight: bold; color: #333;">Promo Code</td>
            <td style="padding: 10px 14px; color: #555;">${lead.promoCode || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #333;">Submitted At</td>
            <td style="padding: 10px 14px; color: #555;">${lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" }) : new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td>
          </tr>
        </table>

        <p style="margin-top: 24px; color: #888; font-size: 13px;">
          This is an automated notification from the MCA Sheriff system. Please log in to the dashboard to take action.
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] New lead notification sent to ${adminEmail}`);
  } catch (error: any) {
    console.error("[SendGrid] Failed to send new lead notification:", error?.response?.body || error?.message || error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CALL COMPLETED NOTIFICATION — sent after AI call finishes and info is gathered
// ─────────────────────────────────────────────────────────────────────────────

export interface CallCompletedEmailData {
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  businessEin?: string;
  ownerSsnLast4?: string;
  businessStartDate?: string;
  monthlyRevenue?: number;
  fundingAmount?: number;
  businessType?: string;
  businessAddress?: string;
  stateName?: string;
  ownerDob?: string;
  ownershipPercentage?: string;
  callSummary?: string;
  bankStatements?: Array<{ fileName: string; s3Key: string }>;
}

/** Download a file from S3 and return its content as a base64 string. */
async function fetchS3FileAsBase64(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: s3Key,
  });
  const response = await s3.send(command);
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("base64");
}

function computeYearsInBusiness(businessStartDate?: string): string {
  if (!businessStartDate) return "N/A";
  const start = new Date(businessStartDate);
  if (isNaN(start.getTime())) return businessStartDate;
  const diffMs = Date.now() - start.getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  return years <= 0 ? "Less than 1 year" : `${years} year${years > 1 ? "s" : ""}`;
}

function row(label: string, value: string, shaded: boolean) {
  const bg = shaded ? 'style="background-color:#f8f9fa;"' : "";
  return `<tr ${bg}>
    <td style="padding:10px 14px;font-weight:bold;color:#333;width:40%;">${label}</td>
    <td style="padding:10px 14px;color:#555;">${value}</td>
  </tr>`;
}

export const sendCallCompletedNotification = async (data: CallCompletedEmailData) => {
  const adminEmail = "james@mcasheriff.com";
  const senderEmail = process.env.SENDER_MAIL || "rohit.hajare@invennico.com";

  const yearsInBusiness = computeYearsInBusiness(data.businessStartDate);

  const rows = [
    row("Full Name",            data.fullName || "N/A",                                          false),
    row("Phone",                data.phone || "N/A",                                             true),
    row("Email",                data.email || "N/A",                                             false),
    row("Business EIN",         data.businessEin || "N/A",                                       true),
    row("Owner SSN (Last 4)",   data.ownerSsnLast4 || "N/A",                                     false),
    row("Business Type",        data.businessType || "N/A",                                      false),
    row("Business Start Date",  data.businessStartDate || "N/A",                                 true),
    row("Years in Business",    yearsInBusiness,                                                 false),
    row("Monthly Revenue",      data.monthlyRevenue ? `$${Number(data.monthlyRevenue).toLocaleString()}` : "N/A", true),
    row("Funding Amount",       data.fundingAmount  ? `$${Number(data.fundingAmount).toLocaleString()}`  : "N/A", false),
    row("Business Address",     data.businessAddress || "N/A",                                   true),
    row("State",                data.stateName || "N/A",                                         false),
    row("Owner DOB",            data.ownerDob || "N/A",                                          true),
    row("Ownership %",          data.ownershipPercentage ? `${data.ownershipPercentage}%` : "N/A", false),
    row("Bank Statements",      data.bankStatements?.length ? `${data.bankStatements.length} file(s) attached` : "None", true),
  ].join("\n");

  const summaryBlock = data.callSummary
    ? `<div style="margin-top:24px;padding:14px;background:#eaf4fb;border-left:4px solid #3498db;border-radius:4px;">
        <strong style="color:#2c3e50;">Call Summary</strong>
        <p style="margin:8px 0 0;color:#444;font-size:14px;">${data.callSummary}</p>
       </div>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
      <h2 style="color:#2c3e50;border-bottom:2px solid #27ae60;padding-bottom:10px;">
        Lead Details
      </h2>
      <p style="color:#555;font-size:15px;">
        An outbound call has been completed and all business information has been collected.
        Please review the details below and process the application.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${rows}
      </table>

      ${summaryBlock}

      <p style="margin-top:24px;color:#888;font-size:13px;">
        This is an automated notification from the MCA Sheriff system.
        Bank statement(s) are attached to this email if available.
      </p>
    </div>
  `;

  // Build SendGrid attachments from S3
  const attachments: any[] = [];
  if (data.bankStatements?.length) {
    for (const doc of data.bankStatements) {
      try {
        const content = await fetchS3FileAsBase64(doc.s3Key);
        const ext = doc.fileName.split(".").pop()?.toLowerCase() || "pdf";
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
        };
        attachments.push({
          content,
          filename: doc.fileName,
          type: mimeMap[ext] || "application/octet-stream",
          disposition: "attachment",
        });
      } catch (err: any) {
        console.error(`[SendGrid] Failed to fetch S3 file ${doc.s3Key}:`, err.message);
      }
    }
  }

  const msg: any = {
    to: adminEmail,
    from: senderEmail,
    subject: `Call Completed — ${data.fullName || data.phone} | MCA Sheriff`,
    html,
    ...(attachments.length ? { attachments } : {}),
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Call completed notification sent to ${adminEmail}`);
  } catch (error: any) {
    console.error("[SendGrid] Failed to send call completed notification:", error?.response?.body || error?.message || error);
  }
};
