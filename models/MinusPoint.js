import mongoose from "mongoose";

const minusPointSchema = new mongoose.Schema({
  className: { type: String, required: true, enum: ["SIDRA", "USRA", "WAFD", "WIDAD", "ITHIHAD", "IFADA"] },
  reason: { type: String, required: true },
  points: { type: Number, required: true },
  approvedBy: { type: String, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MinusPoint", minusPointSchema);
