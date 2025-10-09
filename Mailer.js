import "dotenv/config";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sentFrom = new Sender("chispecialshadrach@gmail.com", "Fenzo Market");

/**
 * Sends an email to a user.
 * @param {{ email: string, name: string }} user
 * @param {{ subject?: string, html?: string, text?: string }} options
 * @returns {Promise<{ success: boolean, message: string, result?: any }>}
 */
export const mailer = async (user, options = {}) => {
  if (!user || !user.email || !user.name) {
    return { success: false, message: "User information missing" };
  }

  try {
    const recipients = [new Recipient(user.email, user.name)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(options.subject || `Hello ${user.name}`)
      .setHtml(
        options.html ||
          `<p>Hi ${user.name}, this is a default message from Fenzo Market.</p>`
      )
      .setText(
        options.text ||
          `Hi ${user.name}, this is a default message from Fenzo Market.`
      );

    const result = await mailerSend.email.send(emailParams);
    console.log("MailerSend result:", result);

    return { success: true, message: "Email sent successfully!", result };
  } catch (err) {
    console.error("Error sending email:", err.message || err);
    return {
      success: false,
      message: err.message || "Failed to send email",
      error: err,
    };
  }
};
