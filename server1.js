// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import { useEffect } from "react";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App config
const app = express();
const PORT = 5000;
const JWT_SECRET = "yourSecretKey";

// ======================= Middleware =======================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api/assets", express.static(path.join(__dirname, "user/assets")));

// JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    req.user = user;
    next();
  });
};

// ======================= Controllers =======================
import { handleSearch, trending } from "./User/controller/search_product.js";
import {
  getTestimonies,
  postTestimony,
} from "./User/controller/Testimonial.js";
import { handleSignup } from "./User/controller/signup.js";
import { getAllStats } from "./Admin/controller/total.js";
import { RecoverAccount } from "./User/controller/Recovery.js";
import { getBanners } from "./User/controller/banner.js";
import { sendMail } from "./User/controller/mailer.js";
import { checkUserExists } from "./User/controller/check_user_exist.js";
import { suscribe } from "./User/controller/subscribe.js";
import {
  getAddress,
  postAddress,
  editAddress,
  deleteAddress,
} from "./User/controller/Address.js";
import { loginUser } from "./User/controller/login.js";
import { Functions } from "./play.js";
import { checkLoginStatus } from "./User/controller/IsLoggedIn.js";
import {
  updateUserProfile,
  changePassword,
} from "./User/controller/Profile.js";
import { product_by_id } from "./User/controller/product_by_id.js";
import { getRecentactivities } from "./User/controller/Activities.js";
import { resetPassword } from "./User/controller/reset-password.js";
import {
  getCart,
  clearCart,
  addToCart,
  updateCart,
  removeFromCart,
  hasInCart,
} from "./User/controller/cart.js";

// ======================= Routes =======================

// Auth & Profile
app.post("/api/signUp", handleSignup);
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(result.status).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "User/assets"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.get("/api/is-logged-in", verifyToken, checkLoginStatus);
app.put(
  "/api/user/update",
  upload.single("image"),
  verifyToken,
  updateUserProfile
);

app.put("/api/user/update-password", verifyToken, changePassword);
app.post("/api/checkUserExists", checkUserExists);
app.get("/api/getAddress", verifyToken, getAddress);
app.post("/api/postAddress", verifyToken, postAddress);
app.put("/api/editAddress/:id", verifyToken, editAddress);
app.delete("/api/deleteAddress/:id", verifyToken, deleteAddress);
app.post("/api/reset", RecoverAccount);
app.put("/api/resetPassword", resetPassword);

// Products
app.get("/api/trends", trending);
app.get("/api/search/:query", (req, res) =>
  handleSearch(req, res, req.params.query)
);
app.get("/api/search", (req, res) => handleSearch(req, res, ""));
app.get("/api/product/:id", product_by_id);
app.get("/api/banners", getBanners);

// Testimonials
app.get("/api/testimonies", getTestimonies);
app.post("/api/testimonies_post", postTestimony);

// Activities & Stats
app.get("/api/recentActivities", verifyToken, getRecentactivities);
app.get("/api/stats", getAllStats);

// Newsletter
app.post("/api/subscribe", suscribe);

// Cart
app.get("/api/cart", verifyToken, getCart);
app.delete("/api/cart/clear", verifyToken, clearCart);
app.post("/api/cart/add", verifyToken, addToCart);
app.put("/api/cart/update", verifyToken, updateCart);
app.delete("/api/cart/remove", verifyToken, removeFromCart);
app.get("/api/cart/has", verifyToken, hasInCart);

// // Example mail (testing purpose)
// const testMail = await sendMail({
//   to: ["chispecialshadrach@gmail.com", "shadrachchukwukerechinemerem@gmail.com"],
//   subject: "Your OTP Code",
//   text: "Your OTP is: 123456",
//   html: "<p>Your OTP is: <b>123456</b></p>",
// });

app.get("/api/play", Functions);

// ======================= Start Server =======================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running at http://0.0.0.0:${PORT}`);
});
