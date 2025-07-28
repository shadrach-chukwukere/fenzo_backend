// ✅ Full Updated server.js with /api/cart/remove and fixes
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db.js';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'yourSecretKey';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
console.log('🔥 server.js is running...');

// 🛡️ JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token not found' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};



// ✅ GET /api/orders
app.get('/api/orders', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        o.id AS order_id,
        o.total_amount,
        o.created_at,
        o.status,
        COUNT(oi.id) AS quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({ success: true, orders: rows });
  } catch (err) {
    console.error("Order fetch error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


// ✅ Inside server.js
app.get('/api/totalOrders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    res.json({ success: true, totalOrders: rows[0].totalOrders });
  } catch (err) {
    console.error('❌ Error fetching totalOrders:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});









app.get('/api/orders/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const orderId = req.params.id;

    const [orderResult] = await db.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    const products = [];
    for (const item of items) {
      const [productResult] = await db.query(
        `SELECT id, title, img1, price FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (productResult.length > 0) {
        products.push({
          ...productResult[0],
          quantity: item.quantity,
          size: item.size,
          color: item.color
        });
      }
    }

    res.json({
      success: true,
      orderInfo: orderResult[0],
      products
    });

  } catch (err) {
    console.error('💥 Server error in GET /api/orders/:id:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});






app.get('/api/cart', verifyToken, async (req, res) => {
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
});



app.delete('/api/cart/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// ✅ Add this to server.js
app.post("/api/verify-password", async (req, res) => {
  const { user_id, password } = req.body;

  try {
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = rows[0].password;

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Password verification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



app.post('/api/checkout', async (req, res) => {
  const { user_id, items, total_amount, payment_method, delivery_fee } = req.body;

  try {
    // Create order entry
    const [orderResult] = await db.query(`
      INSERT INTO orders (user_id, total_amount, payment_method, delivery_fee)
      VALUES (?, ?, ?, ?)
    `, [user_id, total_amount, payment_method, delivery_fee]);

    const orderId = orderResult.insertId;

    // Add order items
    for (const item of items) {
      await db.query(`
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [orderId, item.product_id, item.quantity]);
    }

    // Optionally clear user's cart
    await db.query(`DELETE FROM cart_items WHERE user_id = ?`, [user_id]);

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});







app.put('/api/user/update-password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both current and new passwords are required." });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ✅ Update user profile (name, email, phone, image) - no password
app.put('/api/user/update', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, image = '' } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: "Name, email, and phone are required" });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, image = ? WHERE id = ?',
      [name, email, phone, image, userId]
    );

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




// ✅ Public Routes
app.get('/api/banners', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banners');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Get total Users
app.get('/api/totalUsers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows.length);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user counts' });
  }
});

// Get total Users
app.get('/api/totalProducts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows.length);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products counts' });
  }
});




app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/products/trends', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE rank >= 5');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});



// ✅ Auth Routes
app.post('/api/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? ', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const [existing1] = await db.query('SELECT * FROM users WHERE phone = ? ', [phone]);
    if (existing1.length > 0) {
      return res.status(409).json({ success: false, message: 'Phonenumber already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, phone]);
    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const [result] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(req)
  try {
    let [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [email]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/is-logged-in', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ loggedIn: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Cart Routes
app.post('/api/cart/add', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity, size = '', color = '' } = req.body;
  if (!productId || !quantity) return res.status(400).json({ message: 'Product ID and quantity are required' });
  try {
    const [existing] = await db.query('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?', [userId, productId, size, color]);
    if (existing.length > 0) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?', [quantity, userId, productId, size, color]);
    } else {
      await db.query('INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)', [userId, productId, quantity, size, color]);
    }
    res.status(200).json({ success: true, message: 'Added to cart successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});



app.put('/api/cart/update', verifyToken, (req, res) => {
  const { productId, quantity, size = '', color = '' } = req.body;
  const userId = req.user?.id;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const query = `
    UPDATE cart_items 
    SET quantity = ? 
    WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?
  `;

  db.query(query, [quantity, userId, productId, size, color], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    return res.status(200).json({ success: true, message: "Cart updated successfully" });
  });
});

app.delete('/api/cart/remove', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, size = '', color = '' } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
  try {
    const [result] = await db.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?', [userId, productId, size, color]);
    if (result.affectedRows > 0) {
      return res.json({ success: true, message: 'Item removed from cart' });
    } else {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// app.get('/api/cart', verifyToken, async (req, res) => {
//   const userId = req.user.id;

//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         ci.*, 
//         p.* 
//       FROM cart_items ci
//       JOIN products p ON ci.product_id = p.id
//       WHERE ci.user_id = ?
//     `, [userId]);

//     res.json({ success: true, cart: rows });
//   } catch (err) {
//     console.error('Cart fetch error:', err);
//     res.status(500).json({ success: false, message: 'Database error' });
//   }
// });


app.get('/api/cart/has', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const productId = req.query.product_id;
  if (!productId) return res.status(400).json({ message: 'Product ID is required' });
  try {
    const [rows] = await db.query('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    res.json({ is_cart: rows.length > 0 , quantity : rows[0].quantity });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check cart status' });
  }
});


// app.get('/api/testimonies', async (req, res) => {
//   try {
//     const [results] = await db.query("SELECT * FROM testimonies");
//     res.json(results);
//   } catch (err) {
//     console.error("❌ MySQL error:", err);
//     res.status(500).json({ error: "Database error", details: err });
//   }
// });




// app.post('/api/testimonies_post', async (req, res) => {
//   const { name, textarea } = req.body;
//   if (!name || !textarea) {
//     return res.status(400).json({ success: false, message: "Name and message are required" });
//   }

//   try {
//     await db.query("INSERT INTO testimonies (name, note) VALUES (?, ?)", [name, textarea]);
//     res.json({ success: true, message: "Testimony saved" });
//   } catch (err) {
//     console.error("❌ Insert failed:", err);
//     res.status(500).json({ success: false, message: "Insert failed" });
//   }
// });




// Route with search term
app.get('/api/search/:query', async (req, res) => {
  await handleSearch(req, res, req.params.query);
});

// Route without search term (optional)
app.get('/api/search', async (req, res) => {
  await handleSearch(req, res, "");
});


async function handleSearch(req, res, rawQuery = "") {
  const query = rawQuery?.trim().toLowerCase() || "";
  const { brand, color, size, category } = req.query;

  const filters = [];
  const values = [];

  if (brand && brand.toLowerCase() !== "all") {
    filters.push("LOWER(brand) = ?");
    values.push(brand.toLowerCase());
  }

  if (color && color.toLowerCase() !== "all") {
    filters.push("LOWER(color) = ?");
    values.push(color.toLowerCase());
  }

  if (size && size.toLowerCase() !== "all") {
    filters.push("LOWER(size) = ?");
    values.push(size.toLowerCase());
  }

  if (category && category.toLowerCase() !== "all products") {
    filters.push("LOWER(category) = ?");
    values.push(category.toLowerCase());
  }

  const filterClause = filters.length ? `AND ${filters.join(" AND ")}` : "";

  try {
    let sql = "";
    let finalValues = [];

    if (!query) {
      // Just filters, no search query
      sql = `SELECT * FROM products WHERE 1 ${filterClause}`;
      finalValues = [...values];
    } else {
      const likeQuery = `%${query}%`;

      sql = `
        SELECT * FROM products
        WHERE LOWER(title) LIKE ? ${filterClause}
        UNION
        SELECT * FROM products
        WHERE LOWER(description) LIKE ? AND id NOT IN (
          SELECT id FROM products WHERE LOWER(title) LIKE ?
        ) ${filterClause}
        UNION
        SELECT * FROM products
        WHERE CAST(price AS CHAR) LIKE ? AND id NOT IN (
          SELECT id FROM products WHERE LOWER(title) LIKE ?
          UNION
          SELECT id FROM products WHERE LOWER(description) LIKE ?
        ) ${filterClause}
      `;

      finalValues = [
        likeQuery,              // title
        likeQuery,              // description
        likeQuery,              // exclusion from title match
        likeQuery,              // price
        likeQuery, likeQuery,   // exclusions for title + description
        ...values               // filters repeated after all three queries
      ];
    }

    const [rows] = await db.execute(sql, finalValues);
    res.json(rows);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Server error" });
  }
}


async function getRandomProducts(req, res) {
  try {
    const sql = `SELECT * FROM products ORDER BY RAND() LIMIT 100`;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error("Failed to get random products:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}


app.get("/api/random", getRandomProducts);




import cron from 'node-cron';

import dayjs from 'dayjs';

async function recordDailyOrders() {
  try {
    // Get today's date in DD/MM/YYYY
    const today = dayjs().format('DD/MM/YYYY');

    // Query total orders for today (assuming your orders table has 'created_at' datetime column)
    const queryTotal = `
      SELECT COUNT(*) AS total FROM orders
      WHERE DATE(created_at) = CURDATE()
    `;
    const [result] = await db.promise().query(queryTotal);
    const totalOrders = result[0].total || 0;

    // Insert or update today's total in order_rate
    const upsertQuery = `
      INSERT INTO order_rate (order_date, total_orders)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE total_orders = VALUES(total_orders)
    `;
    await db.promise().query(upsertQuery, [today, totalOrders]);

    console.log(`Recorded orders for ${today}: ${totalOrders}`);
  } catch (error) {
    console.error('Error recording daily orders:', error);
  }
}

cron.schedule('0 0 * * *', () => { // every day at midnight
  recordDailyOrders();
});



















app.get('/api/totalOrder', async (req, res) => {
  try {
    const [results] = await db.query("SELECT order_date, total_orders FROM orderrate ORDER BY order_date ASC");
    res.json(results);
    console.log(results)
    console.log(res)
  } catch (err) {
    console.error("❌ MySQL error:", err);
    res.status(500).json({ error: "Database error", details: err });
  }
});




app.get('/api/allOrders', async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM orders");
    res.json(results);
    console.log(results);
    console.log(res); // 🔴 Unnecessary
  } catch (err) {
    console.error("❌ MySQL error:", err);
    res.status(500).json({ error: "Database error", details: err });
  }
});




app.put('/api/product/update', (req, res) => {
  const { id, title, price, stock, description } = req.body;
  if (!id || !title || !price || !stock || !description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const query = `UPDATE products SET title = ?, price = ?, stock = ?, description = ? WHERE id = ?`;
  db.query(query, [title, price, stock, description, id], (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    return res.json({ message: 'Product updated successfully' });
  });
});




app.delete('/api/product/delete/:id', (req, res) => {
  const productId = req.params.id;

  const deleteOrderItems = `DELETE FROM order_items WHERE product_id = ?`;
  const deleteProduct = `DELETE FROM products WHERE id = ?`;

  db.query(deleteOrderItems, [productId], (err1, result1) => {
    if (err1) {
      console.error('Failed to delete order_items:', err1);
      return res.status(500).json({ message: 'Failed to delete related order items' });
    }

    db.query(deleteProduct, [productId], (err2, result2) => {
      if (err2) {
        console.error('Delete product error:', err2);
        return res.status(500).json({ message: 'Failed to delete product' });
      }

      if (result2.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.json({ message: 'Product and related order items deleted' });
    });
  });
});

















































// aDMIN GET cART FOR USERS
app.get('/api/cart/admin', async (req, res) => {
  const id = req.query.id; // ✅ Correct variable name

  if (!id) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        ci.*, 
        p.*
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [id]);

    res.json({ success: true, cart: rows });
  } catch (err) {
    console.error('Cart fetch error:', err); // ✅ Check for detailed DB error logs
    res.status(500).json({ success: false, message: 'Database error' });
  }
});




// Admin updates another user's info
app.put('/api/user/update/admin', async (req, res) => {
  const { id, name, email, phone, image = '' } = req.body;

  if (!id || !name || !email || !phone) {
    return res.status(400).json({ success: false, message: "ID, name, email, and phone are required" });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await db.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, image = ? WHERE id = ?',
      [name, email, phone, image, id]
    );

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// Admin deletes a user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// Get all users
app.get('/api/users/admin', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users ORDER BY id DESC');

    res.json(users); // or: res.json({ success: true, users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Get all users
app.get('/api/totalUsers', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');

    res.json(users.length); // or: res.json({ success: true, users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



app.get('/api/products/admin', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products');

    res.json(products); // or: res.json({ success: true, products });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.get('/api/totalProducts', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products');

    res.json(products.length); // or: res.json({ success: true, products });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});







app.post('/add-many', async (req, res) => {
  try {
    const { category, products } = req.body;

    if (!category || !products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Invalid input. Category and product array are required.' });
    }

    const values = products.map(p => [
      p.title,
      p.description,
      p.price,
      p.img1,
      p.img2,
      p.img3,
      category,
      p.rank || 1,
      p.stock || 0
    ]);

    const sql = `
      INSERT INTO products (title, description, price, img1, img2, img3, category, rank, stock)
      VALUES ?
    `;

    await db.query(sql, [values]);

    res.status(200).json({ message: 'Products added successfully.' });

  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({ message: 'Server error adding products.' });
  }
});














