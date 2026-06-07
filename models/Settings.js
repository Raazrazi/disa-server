import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  portalName: { type: String, required: true },
  chairman: { type: String, required: true },
  deadline: { type: Number, required: true },
  email: { type: String, required: true }
});

export default mongoose.model("Settings", settingsSchema);
