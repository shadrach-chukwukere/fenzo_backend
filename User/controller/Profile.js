// controllers/userController.js
import { db } from "../../db.js";
import bcrypt from "bcrypt";
import { PostRecentactivities } from "../controller/Activities.js";

// UPDATE PROFILE (only name)
export const updateUserProfile = async (req, res) => {
  try {
    const { firstname, lastname } = req.body;
    const user = req.user;

    if (!firstname) {
      return res
        .status(400)
        .json({ success: false, message: "Firstname is required" });
    }

    const imagePath = req.file
      ? `/assets/${req.file.filename}`
      : user?.profile_image;

    await db.query(
      "UPDATE users SET firstname = ?, lastname = ?, profile_image = ? WHERE id = ?",
      [firstname, lastname, imagePath, user?.id]
    );

    PostRecentactivities(user?.id, "Updated Profile", "profile");

    return res.json({
      success: true,
      user: {
        image: imagePath,
        firstname,
        lastname,
        email: user?.email,
        phone: user?.phone,
      },
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
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    PostRecentactivities(userId, "Changed LogIn Password", "password");

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
