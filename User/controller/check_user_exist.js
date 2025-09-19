import { db } from "../../db.js";

export async function checkUserExists(req, res) {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ success: false, message: "Email or phone required" });
  }

  try {
    // Check by email first, then by phone if not found
    let [rows] = await db.query("SELECT id FROM users WHERE email = ?", [emailOrPhone]);
    if (rows.length === 0) {
      [rows] = await db.query("SELECT id FROM users WHERE phone = ?", [emailOrPhone]);
    }

    res.json({ success: true, exists: rows.length > 0 });
  } catch (err) {
    console.error("Check user exists error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
