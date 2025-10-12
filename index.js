// backend/index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import excelRoutes from "./routes/excelRoutes.js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- MongoDB Connection -----------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/excel-analytics";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------- Routes -----------------
app.use("/api/excel", excelRoutes);

// ----------------- Static folder for uploaded files -----------------
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// ----------------- Start server -----------------
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
