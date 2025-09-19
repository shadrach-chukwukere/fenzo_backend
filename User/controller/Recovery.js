import { db } from "../../db.js";
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
      "SELECT firstname FROM users WHERE email = ? OR phone = ?",
      [email,email]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Account not found." });
    }

    // Generate reset link
    const link = await createResetToken(email);

    res.status(200).json({
      status: true,
      data:email,
      message: rows[0].firstname,
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
