// sesMailer.ts
import {
    SESClient,
    SendEmailCommand,
    SendEmailCommandInput,
  } from "@aws-sdk/client-ses";
  
  const sesClient = new SESClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.EMAIL_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.EMAIL_AWS_SECRET_ACCESS_KEY || "",
    },
  });
  
  interface EmailParams {
    toAddress: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    fromAddress?: string;
  }
  
  export const sendEmail = async ({
    toAddress,
    subject,
    htmlBody,
    textBody,
    fromAddress = process.env.EMAIL_FROM_ADDRESS,
  }: EmailParams): Promise<void> => {
    const ccAddresses = process.env.EMAIL_CC
      ? process.env.EMAIL_CC.split(",").map((email) => email.trim())
      : [];
  
    const params: SendEmailCommandInput = {
      Source: `Scope Engagement Platform <${fromAddress}>`,
      Destination: {
        ToAddresses: [toAddress],
        ...(ccAddresses.length > 0 && { CcAddresses: ccAddresses }),
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: htmlBody,
          },
          ...(textBody && { Text: { Data: textBody } }),
        },
      },
    };
  
    try {
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      console.log("Email sent! Message ID:", response.MessageId);
    } catch (error) {
      console.error("Error sending email via SES SDK:", error);
      throw error;
    }
  };
  