import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ExcelFile from "../models/ExcelFile.js";
import { protect, verifySuperadmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------- Superadmin LOGIN ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "superadmin" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(403).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- Superadmin STATS ----------------------
router.get("/stats", protect, verifySuperadmin, async (req, res) => {
  try {
    const users = await User.countDocuments({ role: "user" });
    const admins = await User.countDocuments({ role: "admin" });
    const files = await ExcelFile.countDocuments();
    res.json({ users, admins, files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------- Get all USERS ----------------------
router.get("/users", protect, verifySuperadmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ---------------------- Get all ADMINS ----------------------
router.get("/admins", protect, verifySuperadmin, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins" });
  }
});

// ---------------------- Get all FILES ----------------------
router.get("/files", protect, verifySuperadmin, async (req, res) => {
  try {
    const files = await ExcelFile.find().populate("uploadedBy", "name email");
    res.json(files);
  } catch (err) {
    console.error("FILES FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching files", error: err.message });
  }
});


// ---------------------- Register a new ADMIN ----------------------
router.post("/register-admin", protect, verifySuperadmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = new User({ name, email, password: hashed, role: "admin" });
    await newAdmin.save();

    res.json({ message: "Admin created", newAdmin });
  } catch (err) {
    res.status(500).json({ message: "Error creating admin" });
  }
});
// GET Superadmin profile
router.get("/profile", protect, verifySuperadmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ message: "Superadmin not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// PUT Superadmin profile update
router.put("/profile", protect, verifySuperadmin, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Superadmin not found" });

    user.name = name || user.name;
    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});


export default router;
