import bcrypt from "bcrypt";
import { db } from "../../db.js";

export async function handleSignup(req, res) {
  const { firstname, lastname, email, password, phone } = req.body;

  // Validate required fields
  if (!firstname || !lastname || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Firstname, lastname and password are required",
      });
  }

  // Require at least email or phone
  if (!email && !phone) {
    return res
      .status(400)
      .json({ success: false, message: "Email or phone number is required" });
  }

  try {
    // Check if email exists
    if (email) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existing.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "Email already exists" });
      }
    }

    // Check if phone exists
    if (phone) {
      const [existingPhone] = await db.query(
        "SELECT id FROM users WHERE phone = ?",
        [phone]
      );
      if (existingPhone.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "Phone number already exists" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.query(
      "INSERT INTO users (firstname, lastname, email, password, phone) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email || null, hashedPassword, phone || null]
    );

    res.status(201).json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
