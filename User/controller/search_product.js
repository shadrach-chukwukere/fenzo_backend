import { db } from "../../db.js";

// 🔹 SEARCH PRODUCTS
export async function handleSearch(req, res, rawQuery = "") {
  const query = rawQuery?.trim().toLowerCase() || "";
  const { brand, color, size, category } = req.query;

  const filters = [];
  const values = [];

  // Apply filters if provided and not "all"
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

    const hasFilters = filters.length > 0;

    if (!query && !hasFilters) {
      sql = `SELECT * FROM products ORDER BY RAND() LIMIT 100`;
    } else if (!query) {
      sql = `SELECT * FROM products WHERE 1 ${filterClause} ORDER BY RAND() LIMIT 100`;
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
        likeQuery, ...values,
        likeQuery, likeQuery, ...values,
        likeQuery, likeQuery, likeQuery, ...values,
      ];
    }

    const [rows] = await db.execute(sql, finalValues);
    res.status(200).json( rows );
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
      `SELECT * FROM products WHERE rank > ? ORDER BY RAND() LIMIT 10`,
      [minRank]
    );

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Trending fetch error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
