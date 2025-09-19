import { db } from "../../db.js";

export async function generateUniqueUsername(first, last) {
  let username;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(Math.random() * 10000);
    username = `${first.toLowerCase()}${last.toLowerCase()}${randomNum}`;

    // Check if username already exists
    const [rows] = await db.query("SELECT id FROM users WHERE username = ?", [
      username,
    ]);
    exists = rows.length > 0;
  }

  return username;
}
