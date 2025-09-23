export const getVerifyEmailHTML = (verificationLink: string): string => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email address</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f2f4f6;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f2f4f6;
      padding: 40px 0;
    }
    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .email-header {
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-height: 40px;
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 600;
      color: #333333;
      margin: 0;
    }
    .email-body {
      padding: 30px;
      color: #4a4a4a;
      font-size: 16px;
      line-height: 1.6;
    }
    .email-body h1 {
      font-size: 22px;
      margin-top: 0;
      color: #333;
    }
    .btn {
      display: inline-block;
      background-color: #3366ff;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .email-footer {
      font-size: 13px;
      color: #999999;
      text-align: center;
      padding: 20px 30px;
      border-top: 1px solid #eaeaea;
    }
    .support-info {
      margin-top: 15px;
      font-size: 14px;
      color: #666666;
    }
    @media (max-width: 600px) {
      .email-content {
        width: 100% !important;
        border-radius: 0;
      }
      .email-body, .email-header, .email-footer {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <div class="email-header">
        <img src="https://scopedatax.s3.ap-south-1.amazonaws.com/logo_scope.png" alt="Scope Logo" class="logo"/>
        <h1 class="brand-title">Scope Engagement Platform</h1>
      </div>
      <div class="email-body">
        <h1>Verify your email</h1>
        <p>Hi there,</p>
        <p>Thank you for signing up with Scope! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${verificationLink}" class="btn">Verify Email</a>
        </p>
        <p>If you did not create an account, please ignore this email or contact our support.</p>
        <p class="support-info">
          Need help? Contact us at <a href="mailto:contact@scope-engagement.sumagodemo.com">contact@scope-engagement.sumagodemo.com</a>.
        </p>
        <p>Thanks,<br>The Scope Team</p>
      </div>
      <div class="email-footer">
        © ${new Date().getFullYear()} Scope Engagement Platform, Sumago Infotech Pvt. Ltd., Nashik<br/>
        All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

