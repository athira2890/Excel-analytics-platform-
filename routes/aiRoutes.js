import express from "express";
import { generateSummary } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/ai/summary
router.post("/summary", protect, generateSummary);

export default router;
