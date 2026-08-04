import mongoose from "mongoose";

const VALID_CATEGORIES = [
  "Union Programs",
  "Outreach",
  "NoticeVerse",
  "Bonus",
  "Publication",
  "DISA Programs"
];

/**
 * Infers category from programme name by checking if the category name
 * appears anywhere inside the programme name (case-insensitive).
 * Falls back to "DISA Programs" when no match is found.
 */
function inferCategoryFromName(programName) {
  if (!programName) return "DISA Programs";
  const lower = programName.toLowerCase().trim();
  for (const cat of VALID_CATEGORIES) {
    if (lower.includes(cat.toLowerCase())) {
      return cat;
    }
  }
  return "DISA Programs";
}

const resultSchema = new mongoose.Schema({
  programName: { type: String, required: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true, enum: ["SIDRA", "USRA", "WAFD", "WIDAD", "ITHIHAD", "IFADA"] },
  prize: { type: String, required: true, enum: ["1st", "2nd", "3rd", "4th", "5th", "6th"] },
  points: { type: Number, required: true },
  isPublished: { type: Boolean, default: false },
  category: {
    type: String,
    enum: VALID_CATEGORIES,
    default: "DISA Programs"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Result", resultSchema);
