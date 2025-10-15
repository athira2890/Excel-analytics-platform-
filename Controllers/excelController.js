import ExcelFile from "../models/ExcelFile.js";
import XLSX from "xlsx";
import OpenAI from "openai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();
console.log("🔑 OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "✅ YES" : "❌ NO");

export const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------- Upload Excel + AI summary ----------------
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!data.length) return res.status(400).json({ message: "Excel file is empty" });

    const newFile = await ExcelFile.create({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      data,
      uploadedBy: req.user._id,
    });

    // AI summary
    const numericValues = data
      .map((row) => Object.values(row).filter((v) => typeof v === "number"))
      .flat();

    let summary = "⚠️ No numeric data available for AI summary.";
    if (numericValues.length > 0) {
      try {
        const aiRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Analyze this numeric data and give a short professional summary. Values: ${numericValues
                .slice(0, 50)
                .join(", ")}`,
            },
          ],
          max_tokens: 100,
        });
        summary = aiRes.choices?.[0]?.message?.content?.trim() || summary;
      } catch (err) {
        console.error("OpenAI error:", err.message);
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const avg = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2);
        const trend =
          numericValues.length >= 2
            ? numericValues[numericValues.length - 1] > numericValues[0]
              ? "an upward trend overall"
              : "a slight downward pattern"
            : "stable readings";
        summary = `⚠️ Mock summary: Values range ${min}-${max}, avg ${avg}. Trend: ${trend}.`;
      }
    }

    res.json({ message: "Upload successful", file: newFile, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// ---------------- Recent files ----------------
export const getRecentFiles = async (req, res) => {
  try {
    const files = await ExcelFile.find({ uploadedBy: req.user._id })
      .sort({ uploadedAt: -1 })
      .limit(5);
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent files" });
  }
};

// ---------------- All files (admin only) ----------------
export const getAllFiles = async (req, res) => {
  try {
    const files = await ExcelFile.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch all files" });
  }
};

// ---------------- Get file by ID ----------------
export const getFileById = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (req.user.role !== "admin" && file.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch file" });
  }
};

// ---------------- Delete file (admin only) ----------------
export const deleteFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    await file.deleteOne(); // ✅ use deleteOne() instead of remove()
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};
