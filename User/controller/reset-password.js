import { db } from "../../db.js";
import bcrypt from "bcrypt";
import { verifyResetToken } from "./createToken.js";

export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    const validation = await verifyResetToken(token);

    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    const email = validation?.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
