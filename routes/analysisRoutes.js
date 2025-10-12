import express from "express";
import Analysis from "../models/Analysis.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ POST /api/analysis/save - save new analysis
router.post("/save", protect, async (req, res) => {
  try {
    const { fileId, xAxis, yAxis, chartType } = req.body;
    if (!fileId || !xAxis || !yAxis || !chartType)
      return res.status(400).json({ message: "Missing required fields" });

    const analysis = await Analysis.create({
      user: req.user._id,
      file: fileId,
      xAxis,
      yAxis,
      chartType,
    });

    res.status(201).json(analysis);
  } catch (err) {
    console.error("Error saving analysis:", err);
    res.status(500).json({ message: "Server error saving analysis" });
  }
});

// ✅ GET /api/analysis - get user's saved analyses
router.get("/", protect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .populate("file", "filename uploadedAt")
      .sort({ createdAt: -1 });

    res.json(analyses);
  } catch (err) {
    console.error("Error fetching analysis:", err);
    res.status(500).json({ message: "Server error fetching analysis" });
  }
});

export default router;
