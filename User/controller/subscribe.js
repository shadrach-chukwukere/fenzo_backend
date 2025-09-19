import { db } from "../../db.js";

export const suscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    await db.query("INSERT INTO subscribe (email) VALUES (?)", [email]);
    return res.status(201).json({ success: true, message: "Subscription successful" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email already subscribed" });
    }

    console.error("Subscribe Error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
