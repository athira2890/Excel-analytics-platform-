const mongoose = require("mongoose");

const sheetSchema = new mongoose.Schema({
  name: String,
  data: [mongoose.Schema.Types.Mixed]
}, { _id: false });

const excelDataSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  filename: { type: String, required: true },
  filepath: { type: String },
  sheets: [sheetSchema],         // all sheets parsed
  data: [mongoose.Schema.Types.Mixed], // convenience: first sheet rows
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ExcelData", excelDataSchema);
