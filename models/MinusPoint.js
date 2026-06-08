import mongoose from "mongoose";

const minusPointSchema = new mongoose.Schema({
  className: { type: String, required: true, enum: ["S1", "S2", "S3", "S4", "S5", "SS1"] },
  reason: { type: String, required: true },
  points: { type: Number, required: true },
  approvedBy: { type: String, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MinusPoint", minusPointSchema);
