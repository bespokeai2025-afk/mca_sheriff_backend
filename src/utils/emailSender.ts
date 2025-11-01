import nodemailer from "nodemailer";

export const sendResetPasswordEmail = async (email: string, resetLink: string) => {
  try {
    //  Configure transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail", // You can replace with Outlook, SendGrid, etc.
      auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your app password (NOT normal email password)
      },
    });

    const mailOptions = {
      from: `"Bespoke" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" 
             style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;"
             target="_blank">
             Reset Password
          </a>
          <p>This link will expire in 10 minutes.</p>
          <hr/>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reset link sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset email");
  }
};
