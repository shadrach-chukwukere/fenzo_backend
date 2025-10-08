import { db } from "../../db.js";
import crypto from "crypto";
export const getChallenge = async (req, res) => {
  const { username, displayName } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const challenge = crypto.randomBytes(32).toString("base64");

  res.json({ challenge });
};

export const registerCred = async (req, res) => {
  const { username, email, credential } = req.body;

  if (!username || !credential) {
    return res.status(400).json({ error: "Username and credential required" });
  }

  if (!credential) {
    return res.status(400).json({ error: "No challenge found for this user" });
  }

  try {
    // Update the user's credentials
    await db.query(
      "UPDATE users SET credentials = ? WHERE email = ? AND username = ?",
      [JSON.stringify(credential), email, username]
    );

    res.json({ success: true, credential });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};
