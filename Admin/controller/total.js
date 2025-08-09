
import { db } from "../../db.js";

export const getAllStats = async (req, res) => {
  try {
    const [orders] = await db.query("SELECT * FROM orders");
    const [users] = await db.query("SELECT * FROM users");
    const [products] = await db.query("SELECT * FROM products");

    res.json({
      success: true,
      orders:orders,
      users: users,
      products: products
    });
  } catch (err) {
    console.error("Error fetching all stats:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
