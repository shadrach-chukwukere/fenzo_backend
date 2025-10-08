import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../db.js";
import { PostRecentactivities } from "./Activities.js";

const JWT_SECRET = "yourSecretKey";

export const loginUser = async (emailOrPhone, password) => {
  if (!emailOrPhone || !password) {
    return {
      status: 400,
      success: false,
      message: "Email/Phone and password are required",
    };
  }

  try {
    // Check user by email or phone in a single query
    let [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1",
      [emailOrPhone, emailOrPhone]
    );

    if (rows.length === 0) {
      return { status: 404, success: false, message: "User not found" };
    }

    const user = rows[0];

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { status: 401, success: false, message: "Incorrect password" };
    }

    // Sign JWT token
    const token = jwt.sign(user, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Record recent login activity (async, no await needed)
    PostRecentactivities(user.id, "Last Logged In", "login");

    return {
      status: 200,
      success: true,
      message: "Login successful",
      token,
      user: {
        image: user.profile_image ? `${user.profile_image}` : null,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        username: user.username,
      },
      _2fa: JSON.parse(user.credentials),
    };
  } catch (err) {
    console.error("Login error:", err.message);
    return { status: 500, success: false, message: "Server error" };
  }
};
