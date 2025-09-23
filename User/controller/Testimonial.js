import { db } from "../../db.js";

// 🔹 POST TESTIMONY
export async function postTestimony(req, res) {
  const { name, textarea } = req.body;

  if (!name || !textarea) {
    return res.status(400).json({
      success: false,
      message: "Name and message are required",
    });
  }

  try {
    await db.query("INSERT INTO testimonies (name, note) VALUES (?, ?)", [
      name,
      textarea,
    ]);

    // fetch updated testimonies
    const [results] = await db.query(
      "SELECT * FROM testimonies ORDER BY RAND() LIMIT 5"
    );

    res.status(201).json({
      success: true,
      message: "Testimony saved",
      data: results,
    });
  } catch (err) {
    console.error("❌ Insert failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Insert failed",
    });
  }
}

// 🔹 GET TESTIMONIES
export async function getTestimonies(req, res) {
  try {
    // Use ORDER BY RAND() carefully; for large tables, consider a LIMIT with offset approach
    const [results] = await db.query(
      "SELECT * FROM testimonies ORDER BY RAND() LIMIT 5"
    );

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("❌ MySQL error:", err.message);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
}
