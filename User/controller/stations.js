import { db } from "../../db.js";

export const stations = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, label, value, fee FROM stations ORDER BY label ASC"
    );
    res.json({
      success: true,
      stations: rows,
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch stations" });
  }
};
