import { db } from "../../db.js";

export const checkLoginStatus = async (req, res) => {
  const user = req.user;

  if (!user?.email) {
    return res.status(400).json({ success: false, message: "User email missing" });
  }

  try {
    const [rows] = await db.query(
      "SELECT firstname, email, phone FROM users WHERE email = ?",
      [user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, loggedIn: true, user: rows[0] });
  } catch (err) {
    console.error("Login status check failed:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
