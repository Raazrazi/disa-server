import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  programName: { type: String, required: true },
  programTitle: { type: String, required: true },
  venue: { type: String, required: true },
  committee: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  posterRequirements: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  eventDateTime: { type: String, required: true },
  priority: { type: String, enum: ["Normal", "High", "Urgent"], default: "Normal" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected", "Completed", "On Hold"], default: "Pending" },
  remarks: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Request", requestSchema);
