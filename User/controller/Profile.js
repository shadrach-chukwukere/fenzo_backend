// controllers/userController.js
import { db } from "../../db.js";
import bcrypt from "bcrypt";
import { PostRecentactivities } from "../controller/Activities.js";

// UPDATE PROFILE (only name)
export const updateUserProfile = async (req, res) => {
  try {
    const { name , image } = req.body;
    console.log(image)
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Update name in database
    await db.query("UPDATE users SET name = ? WHERE id = ?", [name, userId]);

    PostRecentactivities(userId, "Updated Profile Name", "profile");

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Both current and new passwords are required.",
    });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

    PostRecentactivities(userId, "Changed LogIn Password", "password");

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
