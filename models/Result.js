import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  programName: { type: String, required: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true, enum: ["S1", "S2", "S3", "S4", "S5", "SS1"] },
  prize: { type: String, required: true, enum: ["1st", "2nd", "3rd"] },
  points: { type: Number, required: true },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Result", resultSchema);
