import { db } from "../../db.js";

export const checkOut = async (req, res) => {
  const user_id = req.user.id;
  const {
    items,
    total_amount,
    address,
    option,
    payment_method,
    delivery_fee,
    name,
    phone,
    email,
    discount_code,
    sub_total,
  } = req.body;

  if (!user_id || !items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Missing order details" });
  }

  try {
    let discountValue = 0;

    // ✅ Only check discount if code is provided
    if (discount_code && discount_code.trim() !== "") {
      const [discountData] = await db.query(
        "SELECT discount_value, used_count, usage_limit FROM discount_codes WHERE code = ?",
        [discount_code]
      );

      if (!discountData[0]) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid discount code" });
      }

      const { discount_value, used_count, usage_limit } = discountData[0];

      if (used_count >= usage_limit) {
        return res.status(400).json({
          success: false,
          message: "Discount code usage limit reached",
        });
      }

      discountValue = discount_value;
    }

    // ✅ Validate total amount
    if (total_amount !== sub_total + delivery_fee - discountValue) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid total amount" });
    }

    // --- Prepare dynamic insert ---
    const columns = [
      "user_id",
      "total_amount",
      "address",
      "option",
      "payment_method",
      "delivery_fee",
      "status",
      "name",
      "phone",
      "email",
    ];
    const values = [
      user_id,
      total_amount,
      address,
      option,
      payment_method,
      delivery_fee,
      "Processing",
      name,
      phone,
      email,
    ];

    if (discountValue > 0) {
      columns.push("discount_value");
      values.push(discountValue);
    }

    const placeholders = columns.map(() => "?").join(", ");

    // 1️⃣ Insert order
    const [orderResult] = await db.query(
      `INSERT INTO orders (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    const orderId = orderResult.insertId;

    // 2️⃣ Insert items
    for (const item of items) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.product_id, item.quantity]
      );
    }

    // 3️⃣ Clear cart
    await db.query("DELETE FROM cart_items WHERE user_id = ?", [user_id]);

    // 4️⃣ Update discount usage
    if (discountValue > 0) {
      await db.query(
        "UPDATE discount_codes SET used_count = used_count + 1 WHERE code = ?",
        [discount_code]
      );
    }

    // 5️⃣ Return response
    res.json({ success: true, orderId });
  } catch (error) {
    console.error("Checkout error:", error);
    res
      .status(500)
      .json({ success: false, message: "Order creation failed", error });
  }
};
