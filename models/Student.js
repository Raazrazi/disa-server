import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  admissionNo: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true, enum: ["SIDRA", "USRA", "WAFD", "WIDAD", "ITHIHAD", "IFADA"] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Student", studentSchema);
