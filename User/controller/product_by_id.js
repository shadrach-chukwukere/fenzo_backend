import { db } from "../../db.js";

export async function product_by_id(req, res) {
  const { id } = req.params;

  // Validate ID
  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing product ID" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT 
        brand,
        title,
        category,
        description,
        id,
        img1,
        img2,
        img3,
        color,
        stock,
        size,
        rank,
        price,
        discount_percentage,
        discount_price
      FROM products
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product: rows[0] });
  } catch (err) {
    console.error("Database error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
