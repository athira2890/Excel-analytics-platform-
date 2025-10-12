import express from "express";
import { protect, verifyAdmin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import ExcelFile from "../models/ExcelFile.js"; // consistent with File model

const router = express.Router();

// ---------------- All Files ----------------
router.get("/files", protect, verifyAdmin, async (req, res) => {
  try {
    const files = await ExcelFile.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email"); // include uploader info
    res.json(files); // return as array directly
  } catch (err) {
    console.error("Fetch all files error:", err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

// ---------------- Recent Files ----------------
router.get("/files/recent", protect, verifyAdmin, async (req, res) => {
  try {
    const files = await ExcelFile.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "name email");
    res.json({ files });
  } catch (err) {
    console.error("Recent files error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- List Users ----------------
router.get("/users", protect, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Update User Role ----------------
router.patch("/users/:id/role", protect, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Role updated", user });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Update User Info ----------------
router.put("/users/:id", protect, verifyAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Delete User ----------------
router.delete("/users/:id", protect, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Delete File ----------------
router.delete("/files/:id", protect, verifyAdmin, async (req, res) => {
  try {
    const file = await ExcelFile.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ---------------- Get logged-in admin info ----------------
router.get("/me", protect, verifyAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (err) {
    console.error("Fetch admin profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
