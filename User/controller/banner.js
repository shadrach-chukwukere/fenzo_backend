import { db } from "../../db.js";

export const getBanners = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT alt, url FROM banners");
    res.json(rows);
    return rows;
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};
