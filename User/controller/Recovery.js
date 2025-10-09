import { db } from "../../db.js";
import { mailer } from "../../Mailer.js";
import { createResetToken } from "./createToken.js";

export const RecoverAccount = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ status: false, message: "Email is required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT firstname, email FROM users WHERE email = ? OR phone = ?",
      [email, email]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Account not found." });
    }

    const link = await createResetToken(email);
    const userData = { email: rows[0].email, name: rows[0].firstname };

    // Send email but don't fail if email sending fails
    try {
      const mailResult = await mailer(userData, {
        subject: "Password Reset",
        html: `<p>Hi ${userData.name}, click <a href="${link}">here</a> to reset your password.</p>`,
        text: `Hi ${userData.name}, use this link to reset your password: ${link}`,
      });

      if (!mailResult.success) {
        console.warn("MailerSend failed:", mailResult.message);
      }
    } catch (emailErr) {
      console.warn("MailerSend network error:", emailErr.message);
    }

    res.status(200).json({
      status: true,
      data: email,
      message: `Reset link sent to ${userData.email}`,
      link,
    });
  } catch (err) {
    console.error("Database error during account recovery:", err.message);
    res.status(500).json({
      status: false,
      message: "An internal server error occurred.",
    });
  }
};
