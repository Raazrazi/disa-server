import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, enum: ["Posters", "Posts", "Videos"] },
  thumbnail: { type: String, default: "" },
  mediaFile: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Gallery", gallerySchema);
