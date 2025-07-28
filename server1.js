// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { getRecentactivities } from './User/controller/Activities.js';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getCart,
  clearCart,
  addToCart,
  updateCart,
  removeFromCart,
  hasInCart
} from "./User/controller/cart.js"

// Controller imports
import { handleSearch } from './User/controller/search_product.js';
import { getTestimonies, postTestimony } from './User/controller/Testimonial.js';
import { handleSignup } from './User/controller/signup.js';
import uploadImage from './User/controller/image_multer.js';
import { getBanners } from './User/controller/banner.js';
import { sendMail } from './User/controller/mailer.js';
import { checkUserExists } from './User/controller/check_user_exist.js';
import { suscribe } from './User/controller/subscribe.js';
import { loginUser } from './User/controller/login.js';
import { checkLoginStatus } from './User/controller/IsLoggedIn.js';
import { updateUserProfile , changePassword } from './User/controller/Profile.js';
import { product_by_id } from './User/controller/product_by_id.js';
const app = express();
const PORT = 5000;
const JWT_SECRET = 'yourSecretKey';

// 🛡️ JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token not found' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};



// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: true, // Accept all origins dynamically
  credentials: true,
}));


app.use(express.json());

app.get("/api/is-logged-in", verifyToken, checkLoginStatus);

// Serve static images from user/assets
app.use('/assets', express.static(path.join(__dirname, 'user/assets')));

// 🔥 Log
console.log('🔥 server.js is running...');

// ======================= ROUTES =======================

// 🧑‍💻 Signup
app.post('/api/signUp', handleSignup);

app.put('/api/user/update', verifyToken, updateUserProfile);

app.put('/api/user/update-password', verifyToken, changePassword);

app.get('/api/recentActivities',verifyToken,getRecentactivities)

// 🔍 Search routes
app.get('/api/search/:query', async (req, res) => {
  await handleSearch(req, res, req.params.query);
});

app.get('/api/search', async (req, res) => {
  await handleSearch(req, res, "");
});

app.get('/api/banners',getBanners)

app.get('/api/product/:id',product_by_id)

app.use('/assets', express.static(path.join(__dirname, 'user/assets')));

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 💬 Testimonies
app.get('/api/testimonies', getTestimonies);
app.post('/api/testimonies_post', postTestimony);

app.post('/api/checkUserExists', checkUserExists);

// Suscribe
app.post('/api/subscribe', suscribe);

// 📤 Multer Setup to upload image to user/assets
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'user/assets'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 🖼️ Upload image
app.post('/upload', upload.single('image'), uploadImage);

app.get('/api/cart', verifyToken, getCart);
app.delete('/api/cart/clear', verifyToken, clearCart);
app.post('/api/cart/add', verifyToken, addToCart);
app.put('/api/cart/update', verifyToken, updateCart);
app.delete('/api/cart/remove', verifyToken, removeFromCart);
app.get('/api/cart/has', verifyToken, hasInCart);


// somewhere like src/controllers/auth.js

const result = await sendMail({
  to: ["chispecialshadrach@gmail.com", "shadrachchukwukerechinemerem@gmail.com"],
  subject: "Your OTP Code",
  text: "Your OTP is: 123456",
  html: "<p>Your OTP is: <b>123456</b></p>",
});


// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
