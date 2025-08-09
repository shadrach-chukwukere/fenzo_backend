// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db.js';
const JWT_SECRET = 'yourSecretKey'
import { PostRecentactivities } from './Activities.js';

export const loginUser = async(emailOrPhone, password) => {
  let [rows] = await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone]);

  if (rows.length === 0) {
    [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
    if (rows.length === 0) {
      return { status: 404, success: false, message: 'User not found' };
    }
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { status: 401, success: false, message: 'Incorrect password' };
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  PostRecentactivities(user.id,"Last Logged In","login")

  return {
    status: 200,
    success: true,
    message: 'Login successful',
    token,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  };
  
}

