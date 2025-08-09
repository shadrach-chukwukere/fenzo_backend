import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = "my_key";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token not found' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }

    req.user = decoded; // This should include `id`
    next();
  });
};
