// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { updateProfile, getProfile } from "../controllers/userController.js";

const router = express.Router();

// Get user profile
router.get("/profile", protect, getProfile);

// Update user profile
router.put("/profile", protect, updateProfile);

export default router;
