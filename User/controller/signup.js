import bcrypt from 'bcrypt';
import { db } from '../../db.js';

export async function handleSignup(req, res) {
  const { name, email, password, phone } = req.body;

  // Validate required fields: name and password always required
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'Name and password are required' });
  }

  // Require at least email or phone
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const [test] = await db.query("SELECT 1");
    if (email) {
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    if (phone) {
      const [existingPhone] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email || null, hashedPassword, phone || ""]
    );

    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
