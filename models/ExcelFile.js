// backend/models/ExcelFile.js
import mongoose from "mongoose";

const excelFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },       // generated name (uuid)
  originalName: { type: String, required: true },   // original upload name
  data: { type: Array, required: true },            // parsed Excel data
  uploadedBy: {                                     // reference to User model
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  analysis: {                                       // optional AI summary
    summary: { type: String },
    model: { type: String },
    createdAt: { type: Date },
  },
  uploadedAt: { type: Date, default: Date.now },    // timestamp
});

export default mongoose.model("ExcelFile", excelFileSchema);
