import { link } from "fs";
import { db } from "../../db.js";
import { createResetToken } from "./createToken.js";

export const RecoverAccount = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT firstname FROM users WHERE email = ?",
      [email]
    );

    const link = await createResetToken(email);

    if (rows.length > 0) {
      res
        .status(200)
        .json({ message: rows[0].firstname, status: true, link: link });
    } else {
      res.status(404).json({ message: "Account not found.", status: false });
    }
  } catch (err) {
    console.error("Database error during account recovery:", err);
    res
      .status(500)
      .json({ message: "An internal server error occurred.", status: false });
  }
};
