import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExcelFile",
    required: true,
  },
  xAxis: { type: String, required: true },
  yAxis: { type: String, required: true },
  chartType: { type: String, required: true },
  summary: { type: String }, // optional AI summary later
  createdAt: { type: Date, default: Date.now },
});

const Analysis = mongoose.model("Analysis", analysisSchema);
export default Analysis;
