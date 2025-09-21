import { db } from "../../db.js";

export const getOrdersByUser = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query("SELECT * FROM orders WHERE user_id = ?", [
      user_id,
    ]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID is required" });
  }

  try {
    // 1️⃣ Get order info including user details
    const [orderRows] = await db.query(
      `
      SELECT o.id as order_id, o.total_amount, o.payment_method, o.delivery_fee, o.status,
             o.address, o.option, o.created_at, o.updated_at,
             u.id as user_id, u.firstname, u.lastname, u.email, u.phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
      `,
      [orderId]
    );

    if (!orderRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = orderRows[0];

    // 2️⃣ Get order items including product details
    const [itemsRows] = await db.query(
      `
      SELECT oi.id as order_item_id, oi.quantity,
             p.id as product_id, p.title as product_name, p.price, p.img1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      `,
      [orderId]
    );

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsRows,
      },
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch order details" });
  }
};
