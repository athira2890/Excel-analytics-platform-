// controllers/adminController.js
import User from "../models/User.js";
import ExcelFile from "../models/ExcelFile.js";
import Analysis from "../models/Analysis.js";
import fs from "fs";
import path from "path";

export const listUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

export const promoteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.role = "admin";
  await user.save();
  res.json({ message: "Promoted to admin", user });
};

export const deleteFile = async (req, res) => {
  const file = await ExcelFile.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });
  // remove file on disk (if stored locally)
  if (file.path) {
    try {
      fs.unlinkSync(path.join(process.cwd(), file.path));
    } catch (e) {
      // ignore if already removed
    }
  }
  await file.remove();
  res.json({ message: "File deleted" });
};

export const listAllAnalyses = async (req, res) => {
  const analyses = await Analysis.find().populate("file");
  res.json(analyses);
};

export const deleteAnalysis = async (req, res) => {
  const a = await Analysis.findById(req.params.id);
  if (!a) return res.status(404).json({ message: "Not found" });
  await a.remove();
  res.json({ message: "Analysis removed" });
};
