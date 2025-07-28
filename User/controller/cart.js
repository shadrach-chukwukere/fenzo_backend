// controllers/cartController.js
import { db } from '../../db.js';

export async function getCart(req, res) {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(`
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
    `, [userId]);

    res.json({ success: true, cart: rows });
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function addToCart(req, res) {
  const userId = req.user.id;
  const { productId, quantity, size = '', color = '' } = req.body;
  if (!productId || !quantity)
    return res.status(400).json({ message: 'Product ID and quantity are required' });

  try {
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
      [userId, productId, size, color]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
        [quantity, userId, productId, size, color]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
        [userId, productId, quantity, size, color]
      );
    }

    res.status(200).json({ success: true, message: 'Added to cart successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
}

export async function updateCart(req, res) {
  const { productId, quantity, size = '', color = '' } = req.body;
  const userId = req.user?.id;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Step 1: Get product stock
    const [productRows] = await db.query(`SELECT stock FROM products WHERE id = ?`, [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const availableStock = productRows[0].stock;

    // Step 2: Get current quantity in cart for this product, size, and color
    const [cartRows] = await db.query(
      `SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
      [userId, productId, size, color]
    );

    const currentQuantityInCart = cartRows[0]?.quantity || 0;

    // Step 3: Check if requested quantity exceeds stock
    if (quantity > availableStock) {
      return res.status(200).json({
        success: false,
        message: `Only ${availableStock} item(s) are available in stock`,
      });
    }

    if (availableStock < currentQuantityInCart) {
      return res.status(200).json({
        success: false,
        message: `All available items have already been added to the cart`,
      });
    }

    // Step 4: Update cart
    const updateQuery = `
      UPDATE cart_items 
      SET quantity = ? 
      WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?
    `;
    const [result] = await db.query(updateQuery, [quantity, userId, productId, size, color]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    return res.status(200).json({ success: true, message: "Cart updated successfully" });
  } catch (err) {
    console.error("Update cart error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
}



export async function removeFromCart(req, res) {
  const userId = req.user.id;
  const { productId, size = '', color = '' } = req.body;

  if (!productId)
    return res.status(400).json({ success: false, message: 'Product ID is required' });

  try {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
      [userId, productId, size, color]
    );

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: 'Item removed from cart' });
    } else {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
}

export async function hasInCart(req, res) {
  const userId = req.user.id;
  const productId = req.query.product_id;

  if (!productId)
    return res.status(400).json({ message: 'Product ID is required' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({ is_cart: rows.length > 0 ? "yes" : "no", quantity: rows[0]?.quantity ?? 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check cart status' });
  }
}
