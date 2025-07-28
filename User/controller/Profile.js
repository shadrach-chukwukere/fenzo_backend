

import { db } from "../../db.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {PostRecentactivities} from '../controller/Activities.js'

export const updateUserProfile =  async (req, res) => {
  const userId = req.user.id;
  const { name, image = '' } = req.body;

  if (!name ) {
    return res.status(400).json({ success: false, message: "All feilds are required" });
  }


  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    await db.query(
      'UPDATE users SET name = ?,profile_image = ? WHERE id = ?',
      [name, image, userId]
    );

    res.status(200).json({ success: true, message: "User updated successfully" });
    PostRecentactivities(userId,"Updated Profile")
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: err });
  }
}





export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both current and new passwords are required." });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.status(200).json({ success: true, message: "Password updated successfully." });
    PostRecentactivities(userId,"Changed Password")
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}