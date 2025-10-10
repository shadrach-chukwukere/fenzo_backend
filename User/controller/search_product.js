import { db } from "../../db.js";

// Helper: Build SQL base and parameters
function getBaseSqlAndValues(query, filters, values) {
  const filterClause = filters.length ? `AND ${filters.join(" AND ")}` : "";
  // Columns defined for selection in the base query (must exist in DB)
  const selectColumns = "id, img1, price, stock, title"; 
  let baseSql = "";
  let finalValues = [];

  if (!query) {
    baseSql = `SELECT ${selectColumns} FROM products WHERE 1=1 ${filterClause}`;
    finalValues = [...values];
  } else {
    const likeQuery = `%${query}%`;
    const searchConditions = `
      LOWER(title) LIKE ?
      OR LOWER(description) LIKE ?
      OR CAST(price AS CHAR) LIKE ?
      OR LOWER(category) LIKE ?
    `;
    baseSql = `SELECT ${selectColumns} FROM products WHERE (${searchConditions}) ${filterClause}`;
    finalValues = [likeQuery, likeQuery, likeQuery, likeQuery, ...values];
  }

  return { baseSql, finalValues };
}

// 🔹 SEARCH PRODUCTS (Optimized)
export async function handleSearch(req, res, rawQuery = "") {
  const queryParam = req.query.query?.trim().toLowerCase();
  const query = rawQuery?.trim().toLowerCase() || queryParam || "";

  const { brand, color, size, category, discount, minPrice, maxPrice, roll } =
    req.query;

  const page = Math.max(parseInt(roll, 10) || 1, 1);
  const limit = 40;
  const offset = (page - 1) * limit;

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

  const min = parseFloat(minPrice);
  const max = parseFloat(maxPrice);

  if (!isNaN(min) && min >= 0) {
    filters.push("price >= ?");
    values.push(min);
  }
  if (!isNaN(max) && max > 0) {
    filters.push("price <= ?");
    values.push(max);
  }

  if (discount && discount.toLowerCase() !== "all") {
    const minDiscount = parseInt(discount.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(minDiscount) && minDiscount > 0) {
      filters.push(`
        ((price - sale_price) / price * 100 >= ?)
        AND sale_price IS NOT NULL
        AND sale_price < price
      `);
      values.push(minDiscount);
    }
  }

  const { baseSql, finalValues } = getBaseSqlAndValues(query, filters, values);

  try {
    const countSql = `SELECT COUNT(id) AS total_count FROM (${baseSql}) AS T`;
    const [countRows] = await db.execute(countSql, finalValues);
    const totalCount = countRows?.[0]?.total_count || 0;

    const priceSql = `SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM (${baseSql}) AS T`;
    const [priceRows] = await db.execute(priceSql, finalValues);

    // FIX 1: Selecting columns from a subquery (T) must match the columns in the subquery.
    // Removed img3 as it's not in the base query's SELECT.
    const productSql = `SELECT id, img1, price, stock, title FROM (${baseSql}) AS T LIMIT ? OFFSET ?`;
    const [productRows] = await db.execute(productSql, [
      ...finalValues,
      limit,
      offset,
    ]);

    res.status(200).json({
      products: productRows,
      minPriceRange: priceRows?.[0]?.min_price || null,
      maxPriceRange: priceRows?.[0]?.max_price || null,
      totalProducts: totalCount,
    });
  } catch (err) {
    console.error("Search failed:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// 🔹 TRENDING PRODUCTS
export const trending = async (req, res) => {
  try {
    const minRank = parseInt(req.query.rank, 10) || 3;
    const [products] = await db.query(
      // FIX 2: Removed img3 from the direct SELECT statement.
      `SELECT title, id, img1, stock, price , img3
        FROM products 
        WHERE rank > ? 
        ORDER BY RAND() 
        LIMIT 10`,
      [minRank]
    );
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Trending fetch error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
