import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Environment
dotenv.config();

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ----- MIDDLEWARE -----
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // React frontend URL
  credentials: true,
}));

// ----- MONGODB CONNECT -----
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ----- IMPORT ROUTES -----
import authRoutes from "./routes/authRoutes.js";
import excelRoutes from "./routes/excelRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/ai.js";
import superadminRoutes from "./routes/superadmin.js";
import userRoutes from "./routes/userRoutes.js";

// ----- API ROUTES -----
app.use("/api/auth", authRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/user", userRoutes);

// ----- SERVE FRONTEND -----
const frontendPath = path.join(__dirname, "../excel-analytics-frontend/dist"); // <-- match your build folder
app.use(express.static(frontendPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ----- START SERVER -----
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
