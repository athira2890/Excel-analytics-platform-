import express from "express";
import adminRoutes from "./adminRoutes.js";
import fileRoutes from "./files.js";

const router = express.Router();

// Admin/user management
router.use("/admin", adminRoutes);

// Excel file upload/download
router.use("/files", fileRoutes);

export default router;
