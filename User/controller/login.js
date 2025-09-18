// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../db.js";
const JWT_SECRET = "yourSecretKey";
import { PostRecentactivities } from "./Activities.js";

// If you need, import config or base URL
const BASE_URL = "http://localhost:5000"; // adjust if deployed

export const loginUser = async (emailOrPhone, password) => {
  let [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
    emailOrPhone,
  ]);

  if (rows.length === 0) {
    [rows] = await db.query("SELECT * FROM users WHERE phone = ?", [
      emailOrPhone,
    ]);
    if (rows.length === 0) {
      return { status: 404, success: false, message: "User not found" };
    }
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { status: 401, success: false, message: "Incorrect password" };
  }

  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: "1h",
  });

  PostRecentactivities(user.id, "Last Logged In", "login");

  return {
    status: 200,
    success: true,
    message: "Login successful",
    token,
    user: {
      // Use the uploaded file URL if exists
      image: user.profile_image ? `${BASE_URL}${user.profile_image}` : null,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
    },
  };
};
