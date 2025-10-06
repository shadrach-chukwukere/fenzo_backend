import { db } from "../../db.js";

export const register_guest = async (req, res) => {
  try {
    // generate unique guest id
     

    // save in DB
    await db.query("INSERT INTO guest (id) VALUES (?)", [guestId]);

    // return guestId
    return res.status(201).json({
      success: true,
      guest_id: guestId,
    });
  } catch (err) {
    console.error("Error creating guest:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========== Helper: Fetch guest cart ========== */
async function fetchGuestCart(guestId) {
  if (!guestId) return [];

  const [rows] = await db.query(
    `
    SELECT 
      ci.id AS cart_item_id,
      ci.quantity,
      ci.size,
      ci.color,
      p.id AS product_id,
      p.title,
      p.price,
      p.img1,
      p.img2,
      p.img3,
      p.description
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.guest_id = ?
    `,
    [guestId]
  );
  return rows;
}

/* ========== Get Guest Cart ========== */
export async function getGuestCart(req, res) {
  const guestId = req.query.guest_id;

  if (!guestId) {
    return res
      .status(400)
      .json({ success: false, message: "Guest ID is required" });
  }

  try {
    const cart = await fetchGuestCart(guestId);
    res.json({ success: true , cart });
  } catch (err) {
    console.error("Guest cart fetch error:", err.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

/* ========== Add to Guest Cart ========== */
export async function addToGuestCart(req, res) {
  const { guest_id, productId, quantity, size = "", color = "" } = req.body;

  if (!guest_id || !productId || !quantity) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Guest ID, product ID and quantity are required",
      });
  }

  try {
    const [stockRow] = await db.query(
      "SELECT stock FROM products WHERE id = ?",
      [productId]
    );
    if (!stockRow.length)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const [existing] = await db.query(
      "SELECT id FROM cart_items WHERE guest_id = ? AND product_id = ? AND size = ? AND color = ?",
      [guest_id, productId, size, color]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE guest_id = ? AND product_id = ? AND size = ? AND color = ?",
        [quantity, guest_id, productId, size, color]
      );
    } else if (stockRow[0].stock > 0) {
      await db.query(
        "INSERT INTO cart_items (guest_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)",
        [guest_id, productId, quantity, size, color]
      );
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Product out of stock" });
    }

    res.json({ success: true, message: "Added to guest cart" });
  } catch (err) {
    console.error("Add to guest cart error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ========== Remove from Guest Cart ========== */
export async function removeFromGuestCart(req, res) {
  const { guest_id, productId, size = "", color = "" } = req.body;

  if (!guest_id || !productId) {
    return res
      .status(400)
      .json({ success: false, message: "Guest ID and product ID required" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM cart_items WHERE guest_id = ? AND product_id = ? AND size = ? AND color = ?",
      [guest_id, productId, size, color]
    );

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: "Item removed" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in guest cart" });
    }
  } catch (err) {
    console.error("Remove guest cart error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ========== Update Guest Cart ========== */
export async function updateGuestCart(req, res) {
  const { guest_id, productId, quantity, size = "", color = "" } = req.body;

  if (!guest_id || !productId || !quantity) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const [productRows] = await db.query(
      "SELECT stock FROM products WHERE id = ?",
      [productId]
    );
    if (!productRows.length)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (quantity > productRows[0].stock) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Only ${productRows[0].stock} items in stock`,
        });
    }

    const [result] = await db.query(
      "UPDATE cart_items SET quantity = ? WHERE guest_id = ? AND product_id = ? AND size = ? AND color = ?",
      [quantity, guest_id, productId, size, color]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in guest cart" });

    res.json({ success: true, message: "Guest cart updated" });
  } catch (err) {
    console.error("Update guest cart error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ========== Check if product is in Guest Cart ========== */
export async function hasInGuestCart(req, res) {
  const guestId = req.query.guest_id;
  const productId = req.query.product_id;

  if (!guestId || !productId) {
    return res
      .status(400)
      .json({ success: false, message: "Guest ID and product ID required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT quantity FROM cart_items WHERE guest_id = ? AND product_id = ?",
      [guestId, productId]
    );

    res.json({
      is_cart: rows.length > 0 ? "yes" : "no",
      quantity: rows[0]?.quantity || 0,
    });
  } catch (err) {
    console.error("Has in guest cart error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function mergeGuestCartToUser(userId, guestId) {
  if (!userId || !guestId) return [];

  try {
    // Fetch guest cart
    const [guestCart] = await db.query(
      "SELECT product_id, quantity, size, color FROM cart_items WHERE guest_id = ?",
      [guestId]
    );
    if (!guestCart.length) return [];

    // Fetch user cart
    const [userCart] = await db.query(
      "SELECT product_id, size, color FROM cart_items WHERE user_id = ?",
      [userId]
    );

    // Add only items that don't exist in user cart
    for (const item of guestCart) {
      const exists = userCart.some(
        (u) =>
          u.product_id === item.product_id &&
          u.size === item.size &&
          u.color === item.color
      );
      if (!exists) {
        await db.query(
          "INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)",
          [userId, item.product_id, item.quantity, item.size, item.color]
        );
      }
    }

    return true;
  } catch (err) {
    console.error("Merge guest cart error:", err.message);
    return [];
  }
}

export async function deleteGuestAccount(guestId) {
  if (!guestId) return;

  try {
    // Delete cart items of the guest
    await db.query("DELETE FROM cart_items WHERE guest_id = ?", [guestId]);

    // Delete the guest user record
    await db.query("DELETE FROM users WHERE id = ?", [guestId]);
  } catch (err) {
    console.error("Failed to delete guest:", err.message);
  }
}
