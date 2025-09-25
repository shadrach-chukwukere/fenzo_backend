import { db } from "../../db.js";

export const getOrdersByUser = async (req, res) => {
  const user_id = req.user.id;
  let { search, status, payment, sort, dateFrom, dateTo } = req.query;

  // Only select required fields
  let sql = "SELECT id, total_amount, payment_method, status, created_at FROM orders WHERE user_id = ?";
  const params = [user_id];
  const whereClauses = [];

  // Search filter
  if (search) {
    const term = `%${search}%`;
    whereClauses.push(
      "(id LIKE ? OR status LIKE ? OR payment_method LIKE ? OR total_amount LIKE ? OR DATE_FORMAT(created_at, '%M %d, %Y') LIKE ?)"
    );
    params.push(term, term, term, term, term);
  }

  // Status filter
  if (status) {
    whereClauses.push("status = ?");
    params.push(status);
  }

  // Payment method filter
  if (payment) {
    whereClauses.push("payment_method = ?");
    params.push(payment);
  }

  // Date range filter
  const parseDate = (str) => {
    const d = new Date(str);
    if (isNaN(d)) return null;
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  if (dateFrom) {
    const from = parseDate(dateFrom);
    if (from) {
      whereClauses.push("created_at >= ?");
      params.push(from);
    }
  }

  if (dateTo) {
    const to = parseDate(dateTo);
    if (to) {
      whereClauses.push("created_at <= ?");
      params.push(`${to} 23:59:59`);
    }
  }

  // Add WHERE clauses
  if (whereClauses.length > 0) {
    sql += " AND " + whereClauses.join(" AND ");
  }

  // Sorting
  const orderMap = {
    "date-asc": "created_at ASC",
    "date-desc": "created_at DESC",
    "total-asc": "total_amount ASC",
    "total-desc": "total_amount DESC",
  };
  const orderBy = orderMap[sort] || "created_at DESC";
  sql += ` ORDER BY ${orderBy}`;

  // Limit to 50 only if no filters are applied
  if (!search && !status && !payment && !dateFrom && !dateTo) {
    sql += " LIMIT 50";
  }

  try {
    const [rows] = await db.query(sql, params);
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
      SELECT o.id as order_id, o.total_amount, o.payment_method, o.delivery_fee,o.discount_value as discount, o.status,
             o.address, o.option, o.created_at, o.updated_at,
             u.id as user_id, o.name, o.email, o.phone
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
