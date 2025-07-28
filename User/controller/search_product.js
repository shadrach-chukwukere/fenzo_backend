import { db } from "../../db.js";

export async function handleSearch(req, res, rawQuery = "") {
  const query = rawQuery?.trim().toLowerCase() || "";
  const { brand, color, size, category } = req.query;

  const filters = [];
  const values = [];

  const hasBrand = brand && brand.toLowerCase() !== "all";
  const hasColor = color && color.toLowerCase() !== "all";
  const hasSize = size && size.toLowerCase() !== "all";
  const hasCategory = category && category.toLowerCase() !== "all products";

  if (hasBrand) {
    filters.push("LOWER(brand) = ?");
    values.push(brand.toLowerCase());
  }

  if (hasColor) {
    filters.push("LOWER(color) = ?");
    values.push(color.toLowerCase());
  }

  if (hasSize) {
    filters.push("LOWER(size) = ?");
    values.push(size.toLowerCase());
  }

  if (hasCategory) {
    filters.push("LOWER(category) = ?");
    values.push(category.toLowerCase());
  }

  const filterClause = filters.length ? `AND ${filters.join(" AND ")}` : "";

  try {
    let sql = "";
    let finalValues = [];

    const hasFilters = filters.length > 0;

    if (!query && !hasFilters) {
      // No query and no filters: return up to 100 random products
      sql = `SELECT * FROM products ORDER BY RAND() LIMIT 100`;
    } else if (!query) {
      // Only filters, no query
      const isOnlyCategoryFilter =
        hasCategory && !hasBrand && !hasColor && !hasSize;

      if (isOnlyCategoryFilter) {
        sql = `SELECT * FROM products WHERE LOWER(category) = ? ORDER BY RAND() LIMIT 100`;
        finalValues = [category.toLowerCase()];
      } else {
        sql = `SELECT * FROM products WHERE 1 ${filterClause}`;
        finalValues = [...values];
      }
    } else {
      // Query + optional filters
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
        likeQuery,
        ...values,

        likeQuery,
        likeQuery,
        ...values,

        likeQuery,
        likeQuery,
        likeQuery,
        ...values,
      ];
    }

    const [rows] = await db.execute(sql, finalValues);
    res.json(rows);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Server error" });
  }
}
