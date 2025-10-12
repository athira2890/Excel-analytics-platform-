import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import ExcelFile from "../models/ExcelFile.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const newFile = new ExcelFile({
      filename: req.file.originalname,
      path: req.file.path,
      data: sheetData,
    });

    await newFile.save();
    res.json({ message: "File uploaded and parsed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// History route
router.get("/history", async (req, res) => {
  try {
    const files = await ExcelFile.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
