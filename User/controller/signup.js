import bcrypt from "bcrypt";
import { db } from "../../db.js";

export async function handleSignup(req, res) {
  const { firstname, lastname, email, password, phone } = req.body;

  // Validate required fields
  if (!firstname || !lastname || !password) {
    return res.status(400).json({
      success: false,
      message: "Firstname, lastname and password are required",
    });
  }

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "Email or phone number is required",
    });
  }

  try {
    // Check if email or phone already exists in a single query
    const [existing] = await db.query(
      "SELECT id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
      [email || "", phone || ""]
    );

    if (existing.length > 0) {
      if (existing[0].email === email) {
        return res.status(409).json({ success: false, message: "Email Address Already Exist" });
      }
      if (existing[0].phone === phone) {
        return res.status(409).json({ success: false, message: "Phone Number Already Exist" });
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
    console.error("Signup error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
