import express from "express";
import { protect, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadExcel, getRecentFiles } from "../controllers/excelController.js";

import { upload } from "../controllers/excelController.js"; // memoryStorage

const router = express.Router();

// ---------------- Routes ----------------
router.post("/upload", protect, upload.single("file"), uploadExcel);
router.get("/recent", protect, getRecentFiles);

// Admin routes
router.get("/all", protect, verifyAdmin, async (req, res) => {
  try {
    const files = await ExcelFile.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error("❌ Admin fetch error:", err);
    res.status(500).json({ message: "Failed to fetch all files" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (
      req.user.role !== "admin" &&
      file.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(file);
  } catch (err) {
    console.error("❌ File fetch error:", err);
    res.status(500).json({ message: "Failed to fetch file" });
  }
});

router.delete("/:id", protect, verifyAdmin, async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    await file.deleteOne();
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
