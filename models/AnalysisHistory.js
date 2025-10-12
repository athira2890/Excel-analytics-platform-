import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: "ExcelFile", required: true },
  xAxis: String,
  yAxis: String,
  zAxis: String,
  chartType: { type: String, default: "2D" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AnalysisHistory", AnalysisSchema);
