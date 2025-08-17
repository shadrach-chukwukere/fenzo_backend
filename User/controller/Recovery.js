import { db } from "../../db.js";
export const RecoverAccount = async (req, res) => {
  const { email } = req.body;
  try {
    const [row] = await db.query("SELECT name FROM users WHERE email = ?", [
      email,
    ]);
    if (row.length > 0) {
      res.status(200).json({ message: row[0]?.name, status: true });
      return true;
    } else {
      res.status(404).json({message:"not found",status:false});
      return false;
    }
  } catch (err) {
    res.status(404);
    return false;
  }
};
