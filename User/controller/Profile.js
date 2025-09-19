import { db } from "../../db.js";
import bcrypt from "bcrypt";
import { PostRecentactivities } from "../controller/Activities.js";

// 🔹 UPDATE PROFILE (name & optional profile image)
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
      message: "Profile updated successfully",
      user: {
        image: imagePath,
        firstname,
        lastname,
        email: user?.email,
        phone: user?.phone,
        username: user?.username,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Both current and new passwords are required.",
    });
  }

  try {
    const [users] = await db.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);
    if (!users.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
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

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
