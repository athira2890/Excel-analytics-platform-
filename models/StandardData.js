import mongoose from "mongoose";

const standardDataSchema = new mongoose.Schema({
  Name: String,
  Email: String,
  Phone: String,
  Amount: Number,
  Date: Date,
});

export default mongoose.model("StandardData", standardDataSchema);
