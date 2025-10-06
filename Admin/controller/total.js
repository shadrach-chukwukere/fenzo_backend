import { db } from "../../db.js";

// Helper to calculate growth rate
const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return { change: current > 0 ? "+100%" : "0%", isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, isPositive: change >= 0 };
};

// Helper to format dates for MySQL
const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

export const getAllStats = async (req, res) => {
  try {
    const today = new Date();

    // Define periods
    const currentStart = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const previousStart = formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)); // 60 days ago
    const endDate = formatDate(today);



    // --- Orders Stats ---
    const [ordersStats] = await db.query(
      `
      SELECT 
        COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN id END) AS current,
        COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN id END) AS previous
      FROM orders
      `,
      [currentStart, endDate, previousStart, currentStart]
    );
    const orderGrowth = calculateGrowthRate(ordersStats[0].current, ordersStats[0].previous);

    // --- User Stats ---
    const [userStats] = await db.query(
      `
      SELECT 
        COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN id END) AS current,
        COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN id END) AS previous
      FROM users
      `,
      [currentStart, endDate, previousStart, currentStart]
    );
    console.log(userStats)
    const userGrowth = calculateGrowthRate(userStats[0].current, userStats[0].previous);

    // --- Product Stats (Static total) ---
    const [productStats] = await db.query("SELECT COUNT(id) AS total FROM products");

    // --- Compile Response ---
    res.json({
      success: true,
      stats: {
        totalOrders: {
          metric: ordersStats[0].current.toLocaleString(),
          change: orderGrowth.change,
          isPositive: orderGrowth.isPositive,
        },
        newCustomers: {
          metric: userStats[0].current.toLocaleString(),
          change: userGrowth.change,
          isPositive: userGrowth.isPositive,
        },
        totalProducts: {
          metric: productStats[0].total.toLocaleString(),
          change: "N/A",
          isPositive: true,
        },
      }
    });

  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
