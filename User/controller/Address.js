// controller/Address.js
import { db } from "../../db.js";

// Get all addresses for a user
export const getAddress = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(400).json({ success: false, message: "User ID missing" });

  try {
    const [addresses] = await db.query(
      "SELECT id, address_line, city, state FROM address WHERE user_id = ?",
      [user_id]
    );
    res.json({ success: true, addresses });
  } catch (err) {
    console.error("Error fetching addresses:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
};

// Add a new address (max 2 per user)
export const postAddress = async (req, res) => {
  const user_id = req.user?.id;
  const { address_line, city, state } = req.body;

  if (!user_id || !address_line || !city || !state) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const [existing] = await db.query(
      "SELECT COUNT(*) as count FROM address WHERE user_id = ?",
      [user_id]
    );

    if (existing[0].count >= 2) {
      return res.status(400).json({ success: false, message: "Only 2 addresses are allowed" });
    }

    const [result] = await db.query(
      "INSERT INTO address (user_id, address_line, city, state) VALUES (?, ?, ?, ?)",
      [user_id, address_line, city, state]
    );

    res.json({ success: true, message: "Address added successfully", insertId: result.insertId });
  } catch (err) {
    console.error("Error adding address:", err.message);
    res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

// Edit an existing address
export const editAddress = async (req, res) => {
  const user_id = req.user?.id;
  const { id } = req.params;
  const { address_line, city, state } = req.body;

  if (!user_id || !id || !address_line || !city || !state) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const [result] = await db.query(
      "UPDATE address SET address_line = ?, city = ?, state = ? WHERE id = ? AND user_id = ?",
      [address_line, city, state, id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Address not found or not owned by user" });
    }

    res.json({ success: true, message: "Address updated successfully" });
  } catch (err) {
    console.error("Error updating address:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  const user_id = req.user?.id;
  const { id } = req.params;

  if (!user_id || !id) {
    return res.status(400).json({ success: false, message: "Address ID and User ID are required" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM address WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Address not found or not owned by user" });
    }

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error("Error deleting address:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
