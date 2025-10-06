import bcrypt from "bcrypt";
import { db } from "../../db.js";
import jwt from "jsonwebtoken";
import { generateUniqueUsername } from "./username.js";

export async function handleSignup(req, res) {
  const JWT_SECRET = "yourSecretKey";
  const { firstname, lastname, email, password, phone, guest } = req.body;
  const { guest_carts } = guest || {};

  if (!firstname || !lastname || !password || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "All feilds are required",
      errors: { form: "All feilds are required" },
    });
  } else {
    try {
      // Check if user already exists
      const [existing] = await db.query(
        "SELECT id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
        [email || "", phone || ""]
      );

      if (existing.length > 0) {
        if (email && existing[0].email === email) {
          return res.status(409).json({
            success: false,
            message: "Email Address Already Exist",
            errors: { email: "Email Address Already Exist" },
          });
        }
        if (phone && existing[0].phone === phone) {
          return res.status(409).json({
            success: false,
            message: "Phone Number Already Exist",
            errors: { phone: "Phone Number Already Exist" },
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique username
      const username = await generateUniqueUsername(firstname, lastname);

      // Insert user and grab insertId directly
      const [insertResult] = await db.query(
        "INSERT INTO users (firstname, lastname, email, password, phone, username) VALUES (?, ?, ?, ?, ?, ?)",
        [
          firstname,
          lastname,
          email || null,
          hashedPassword,
          phone || null,
          username,
        ]
      );

      const userId = insertResult.insertId;

      await guest_carts.forEach(async (item) => {
        if (item?.product_id) {
          await db.query(
            "INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)",
            [userId, item.product_id, item.quantity, item.size, item.color]
          );
        }
      });

      let [rows] = await db.query(
        "SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1",
        [email, phone]
      );

      const user = rows[0];

      const token = await jwt.sign(user, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({
        success: true,
        status: 200,
        message: "Signup successful",
        token,
        user: {
          image: user.profile_image ? user.profile_image : null,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          username: user.username,
        },
      });
    } catch (err) {
      console.error("Signup error:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
