import { db } from "../../db.js";

export const checkLoginStatus = async (req, res) => {
  const user = req.user
  try {
    const [rows] = await db.query(
      "SELECT name, email, phone FROM users WHERE email = ? ",
      [user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ loggedIn: true, user: rows[0] });
  } catch (err) {
    console.error("Login status check failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
