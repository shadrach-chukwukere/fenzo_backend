import { db } from "../../db.js";

// 🔹 SEARCH PRODUCTS
export async function handleSearch(req, res, rawQuery = "") {
  const queryParam = req.query.query?.trim().toLowerCase();
  const query = rawQuery?.trim().toLowerCase() || queryParam || "";

  const { brand, color, size, category, discount, minPrice, maxPrice } =
    req.query;

  const filters = [];
  const values = [];

  // Filters
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
      filters.push(`(
        (price - sale_price) / price * 100 >= ?
        AND sale_price IS NOT NULL
        AND sale_price < price
      )`);
      values.push(minDiscount);
    }
  }

  const filterClause = filters.length ? `AND ${filters.join(" AND ")}` : "";

  try {
    let baseSql = "";
    let finalValues = [];

    const hasFilters = filters.length > 0;

    if (!query && !hasFilters) {
      baseSql = `(SELECT * FROM products)`;
    } else if (!query) {
      baseSql = `(SELECT * FROM products WHERE 1 ${filterClause})`;
      finalValues = [...values];
    } else {
      const likeQuery = `%${query}%`;
      const f1 = [...values],
        f2 = [...values],
        f3 = [...values],
        f4 = [...values];

      baseSql = `
        (
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
            UNION SELECT id FROM products WHERE LOWER(description) LIKE ?
          ) ${filterClause}
          
          UNION
          SELECT * FROM products
          WHERE LOWER(category) LIKE ? AND id NOT IN (
            SELECT id FROM products WHERE LOWER(title) LIKE ?
            UNION SELECT id FROM products WHERE LOWER(description) LIKE ?
            UNION SELECT id FROM products WHERE CAST(price AS CHAR) LIKE ?
          ) ${filterClause}
        )
      `;

      finalValues = [
        likeQuery,
        ...f1,
        likeQuery,
        likeQuery,
        ...f2,
        likeQuery,
        likeQuery,
        likeQuery,
        ...f3,
        likeQuery,
        likeQuery,
        likeQuery,
        likeQuery,
        ...f4,
      ];
    }

    const priceSql = `SELECT MIN(T.price) AS min_price, MAX(T.price) AS max_price FROM ${baseSql} AS T`;
    const productSql = `SELECT title , id , img1,stock,price FROM ${baseSql} AS T ORDER BY RAND() LIMIT 50`;

    const [priceRows] = await db.execute(priceSql, finalValues);
    const [productRows] = await db.execute(productSql, finalValues);

    res.status(200).json({
      products: productRows,
      minPriceRange: priceRows?.[0]?.min_price || null,
      maxPriceRange: priceRows?.[0]?.max_price || null,
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
      `SELECT title , id , img1,stock,price FROM products WHERE rank > ? ORDER BY RAND() LIMIT 10`,
      [minRank]
    );
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Trending fetch error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
