// controller/Address.js
import { db } from "../../db.js";

export const getAddress = async (req, res) => {
  const { id, email } = req.user; // from middleware

  try {
    const [addresses] = await db.query(
      "SELECT id, address_line, city, state FROM address WHERE user_id = ?",
      [id]
    );
    res.json({ success: true, address: addresses });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch address" });
  }
};

export const postAddress = async (req, res) => {
  const id = req.user.id; // ✅ fixed
  const { address_line, city, state } = req.body;

  if (!address_line || !city || !state) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    // Optional: Check existing addresses
    const [current] = await db.query(
      "SELECT id FROM address WHERE user_id = ?",
      [id]
    );
    
    if (current.length < 2) {
      const [result] = await db.query(
        "INSERT INTO address (user_id, address_line, city, state) VALUES (?, ?, ?, ?)",
        [id, address_line, city, state]
      );

      res.json({
        success: true,
        message: "Address added successfully",
        insertId: result.insertId,
      });
    }
    else {
      res.json({
        success: false,
        message: "Only 2 address is needed"
      })
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

export const editAddress = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { id } = req.params;
    const { address_line, city, state } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({ message: "Failed to Edit" });
    }

    const [result] = await db.query(
      `UPDATE address
       SET address_line = ?, city = ?, state = ?
       WHERE id = ? AND user_id = ?`,
      [address_line, city, state, id, user_id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Address not found or not owned by user" });
    }

    res.json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Address
export const deleteAddress = async (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;

  try {
    if (!id || !user_id) {
      return res
        .status(400)
        .json({ message: "Address ID and User ID are required" });
    }

    const [result] = await db.query(
      `DELETE FROM address WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Address not found or not owned by user" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
