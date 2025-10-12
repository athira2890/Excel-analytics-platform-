import ExcelFile from "../models/ExcelFile.js";
import XLSX from "xlsx";
import fs from "fs";

export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Parse Excel file to JSON using xlsx
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    // Save file meta + parsed data to DB
    const newFile = new ExcelFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      data: jsonData
    });
    await newFile.save();

    res.json({ message: "File uploaded and parsed successfully", id: newFile._id });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getFiles = async (req, res) => {
  try {
    const files = await ExcelFile.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error("Fetch files error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFileById = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    // send the file from uploads/
    return res.download(file.path, file.originalName);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Optional: delete uploaded file record + delete file from disk
export const deleteFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    // delete file from disk if exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await ExcelFile.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
