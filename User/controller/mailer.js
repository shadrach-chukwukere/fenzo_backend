// src/utils/sendMail.js
import nodemailer from 'nodemailer';

// You can move these credentials to environment variables (.env)
// Looking to send emails in production? Check out our Email API/SMTP product!
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "8a50f22314d51f",
    pass: "91285caea547bf"
  }
});

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch" <maddison53@ethereal.email>', // sender name
      to, // can be a string or array of emails
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info)); // only works for ethereal
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    return { success: false, error: err.message };
  }
};
