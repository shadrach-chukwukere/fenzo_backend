import { db } from "../../db.js";

// 🔹 Helper: Fetch user's cart
async function fetchCart(userId) {
  const [rows] = await db.query(
    `
    SELECT 
      ci.id AS cart_item_id,
      ci.quantity,
      p.id AS product_id,
      p.title,
      p.price,
      p.img1,
      p.img2,
      p.img3,
      p.description
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
    `,
    [userId]
  );
  return rows;
}

// 🔹 Get cart
export async function getCart(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const cart = await fetchCart(userId);
    res.json({ success: true, cart });
  } catch (err) {
    console.error("Cart fetch error:", err.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

// 🔹 Clear cart
export async function clearCart(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    await db.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    const cart = await fetchCart(userId);
    res.json({ success: true, message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error("Clear cart error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// 🔹 Add to cart
export async function addToCart(req, res) {
  const userId = req.user?.id;
  const { productId, quantity, size = "", color = "" } = req.body;

  if (!userId || !productId || !quantity)
    return res.status(400).json({ message: "Product ID and quantity are required" });

  try {
    const [existing] = await db.query(
      "SELECT id FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?",
      [userId, productId, size, color]
    );

    const [stockRow] = await db.query("SELECT stock FROM products WHERE id = ?", [productId]);
    if (!stockRow.length)
      return res.status(404).json({ success: false, message: "Product not found" });

    if (existing.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?",
        [quantity, userId, productId, size, color]
      );
    } else if (stockRow[0].stock > 0) {
      await db.query(
        "INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)",
        [userId, productId, quantity, size, color]
      );
    } else {
      return res.status(400).json({ success: false, message: "This product is out of stock" });
    }

    const cart = await fetchCart(userId);
    res.status(200).json({ success: true, message: "Added to cart successfully", cart });
  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
}

// 🔹 Update cart
export async function updateCart(req, res) {
  const userId = req.user?.id;
  const { productId, quantity, size = "", color = "" } = req.body;

  if (!userId || !productId || !quantity)
    return res.status(400).json({ success: false, message: "Missing required fields" });

  try {
    const [productRows] = await db.query("SELECT stock FROM products WHERE id = ?", [productId]);
    if (!productRows.length)
      return res.status(404).json({ success: false, message: "Product not found" });

    const availableStock = productRows[0].stock;
    if (quantity > availableStock)
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} item(s) are available in stock`,
      });

    const [result] = await db.query(
      "UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?",
      [quantity, userId, productId, size, color]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Item not found in cart" });

    const cart = await fetchCart(userId);
    res.status(200).json({ success: true, message: "Cart updated successfully", cart });
  } catch (err) {
    console.error("Update cart error:", err.message);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

// 🔹 Remove from cart
export async function removeFromCart(req, res) {
  const userId = req.user?.id;
  const { productId, size = "", color = "" } = req.body;

  if (!userId || !productId)
    return res.status(400).json({ success: false, message: "Product ID is required" });

  try {
    const [result] = await db.query(
      "DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?",
      [userId, productId, size, color]
    );

    const cart = await fetchCart(userId);

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: "Item removed from cart", cart });
    } else {
      return res.status(404).json({ success: false, message: "Item not found in cart", cart });
    }
  } catch (err) {
    console.error("Remove cart error:", err.message);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
}

// 🔹 Check if product is in cart
export async function hasInCart(req, res) {
  const userId = req.user?.id;
  const productId = req.query.product_id;

  if (!userId || !productId)
    return res.status(400).json({ message: "Product ID is required" });

  try {
    const [rows] = await db.query(
      "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    res.json({
      is_cart: rows.length > 0 ? "yes" : "no",
      quantity: rows[0]?.quantity ?? 0,
    });
  } catch (err) {
    console.error("Has in cart error:", err.message);
    res.status(500).json({ message: "Failed to check cart status" });
  }
}
