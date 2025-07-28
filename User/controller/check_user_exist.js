// controllers/authController.js
import { db } from "../../db.js";


export async function checkUserExists(req, res) {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ success: false, message: 'Email or phone required' });
  }

  try {
    let [rows] = await db.query('SELECT id FROM users WHERE email = ?', [emailOrPhone]);
    if (rows.length === 0) {
      [rows] = await db.query('SELECT id FROM users WHERE phone = ?', [emailOrPhone]);
    }

    return res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
