import { db } from "../../db.js";


export async function postTestimony(req, res) {
  const { name, textarea } = req.body;

  if (!name || !textarea) {
    return res.status(400).json({
      success: false,
      message: "Name and message are required",
    });
  }

  try {
    await db.query(
      "INSERT INTO testimonies (name, note) VALUES (?, ?)",
      [name, textarea]
    );

    res.json({ success: true, message: "Testimony saved" });
  } catch (err) {
    console.error("❌ Insert failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Insert failed",
    });
  }
}





export async function getTestimonies(req, res) {
  try {
    const [results] = await db.query("SELECT * FROM testimonies ORDER BY RAND() LIMIT 10");
    res.json(results);
  } catch (err) {
    console.error("❌ MySQL error:", err);
    res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
}
