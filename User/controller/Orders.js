import { db } from "../../db.js";

export const getOrdersByUser = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query("SELECT * FROM orders WHERE user_id = ?", [user_id]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
