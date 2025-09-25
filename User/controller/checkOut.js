import { db } from "../../db.js";

export const checkOut = async (req, res) => {
  const user_id = req.user.id;
  const { items, total_amount, address, option, payment_method, delivery_fee , name , phone, email } =
    req.body;

  if (!user_id || !items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Missing order details" });
  }

  try {
    // 1️⃣ Create main order entry
    const [orderResult] = await db.query(
      `
      INSERT INTO orders 
        (user_id, total_amount, address, option, payment_method, delivery_fee,status,name,phone,email)
      VALUES (?, ?, ?, ?, ?, ?,?,?,?,?)
      `,
      [user_id, total_amount, address, option, payment_method, delivery_fee,"Processing",name,phone,email]
    );

    const orderId = orderResult.insertId;

    // 2️⃣ Insert items into order_items
    for (const item of items) {
      await db.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (?, ?, ?)
        `,
        [orderId, item.product_id, item.quantity]
      );
    }

    // 3️⃣ Clear the cart after checkout (optional)
    await db.query(`DELETE FROM cart_items WHERE user_id = ?`, [user_id]);

    // 4️⃣ Return response
    res.json({ success: true, orderId });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};
