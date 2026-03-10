import sgMail from "@sendgrid/mail";

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
