// src/script/discount.js
import { db } from "../../db.js"; // your MySQL connection

export const applyDiscount = async (code, cartTotal) => {
  try {
    // 1. Fetch the discount code
    const [rows] = await db.execute(
      `SELECT * FROM discount_codes WHERE code = ? LIMIT 1`,
      [code]
    );

    if (rows.length === 0) {
      return { success: false, message: "Discount code not found." };
    }

    const discount = rows[0];

    // 2. Check if active
    if (!discount.is_active) {
      return { success: false, message: "This discount code is inactive." };
    }

    // 3. Check expiry
    const now = new Date();
    if (discount.expiry_date && now > discount.expiry_date) {
      return { success: false, message: "This discount code has expired." };
    }

    // 4. Check usage limit
    if (
      discount.usage_limit !== null &&
      discount.used_count >= discount.usage_limit
    ) {
      return {
        success: false,
        message: "This discount code has reached its usage limit.",
      };
    }

    // 5. Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === "percentage") {
      discountAmount = (cartTotal * discount.discount_value) / 100;
    } else if (discount.discount_type === "fixed") {
      discountAmount = discount.discount_value;
    }

    // 6. Increment used_count
    await db.execute(
      `UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?`,
      [discount.id]
    );

    return {
      success: true,
      discountAmount,
      message: `Discount applied successfully! You saved $${discountAmount.toFixed(
        2
      )}`,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to apply discount code." };
  }
};

export const validateDiscountCode = async (req, res) => {
  const code = req.params.code;
  try {
    const [rows] = await db.query(
      "SELECT * FROM discount_codes WHERE code = ?",
      [code]
    );
    if (rows.length == 1) {
      const row = rows[0];
      if (row.is_active) {
        if (new Date().toISOString() >= row.expiry_date) {
          return res.json({ status: false, message: "Token Expired" });
        } else if (row.usage_limit == row.used_count) {
          return res.json({
            status: false,
            message: "Discount code has been used up",
          });
        } else {
          return res.json({
            status: true,
            message: "Discount code is valid",
            description: row.description,
            value: row.discount_value,
          });
        }
      } else {
        return res.json({ status: false, message: "Invalid discount code" });
      }
    } else {
      return res.json({ status: false, message: "Invalid discount code" });
    }
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to validate discount code" };
  }
};

export const fetchDiscount = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM discount_codes");
  return res.json({ rows });
};
