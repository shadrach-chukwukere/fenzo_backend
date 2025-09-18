import jwt from "jsonwebtoken";

const JWT_SECRET = "my_key";

export async function createResetToken(data) {
  // expires in 15 minutes
  return jwt.sign({ data }, JWT_SECRET, { expiresIn: "15m" });
}

export async function verifyResetToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded.data };
  } catch (err) {
    return { valid: false, message: "Invalid or expired token" };
  }
}
