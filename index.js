import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import RequestModel from "./models/Request.js";
import SettingsModel from "./models/Settings.js";
import ResultModel from "./models/Result.js";
import MinusPointModel from "./models/MinusPoint.js";
import GalleryModel from "./models/Gallery.js";
import AnnouncementModel from "./models/Announcement.js";
import StudentModel from "./models/Student.js";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import multer from "multer";
import csvParser from "csv-parser";
import cloudinary from "./config/cloudinary.js";
import { error } from "console";

dotenv.config();

// Multer setup
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully");
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/union-media";

const startServer = async () => {
  try {
    mongoose.connection.on('connected', () => {
      const safeUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
      console.log("Mongoose connected to db at:", safeUri);
    });

    mongoose.connection.on('error', (err) => {
      console.error("Mongoose connection error:", err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log("Mongoose connection is disconnected");
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log("Mongoose connection closed on app termination");
      process.exit(0);
    });

    await mongoose.connect(MONGODB_URI);
    
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

const defaultSettings = {
  portalName: "Students Union Media Portal",
  chairman: "Ahmed Jasim",
  deadline: 48,
  email: "media.chairman.disa@gmail.com"
};

// Database Initialization helper
async function initializeDatabase() {
  try {
    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      console.log("No settings found. Seeding default system settings to MongoDB...");
      await SettingsModel.create(defaultSettings);
    }
  } catch (err) {
    console.error("Database initialization failure:", err);
  }
}

// REST Endpoints

// 1. Get all requests (ordered by event date and time given)
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await RequestModel.find().sort({ eventDateTime: 1, createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests", details: err.message });
  }
});

// 2. Submit a new request
app.post("/api/requests", async (req, res) => {
  try {
    // Generate unique ID in backend as well
    const currentYear = new Date().getFullYear();
    const yearPrefix = `REQ-${currentYear}-`;
    
    // Find requests matching the prefix, sort desc to find the max index
    const latestRequest = await RequestModel.findOne({ requestId: new RegExp(`^${yearPrefix}`) })
      .sort({ requestId: -1 });
    
    let nextNum = 1;
    if (latestRequest) {
      const parts = latestRequest.requestId.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    
    const paddedNum = String(nextNum).padStart(3, "0");
    const requestId = `${yearPrefix}${paddedNum}`;

    const newRequest = new RequestModel({
      ...req.body,
      requestId,
      status: "Pending",
      createdAt: new Date()
    });

    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Failed to save request", details: err.message });
  }
});

// 3. Update request status and remarks
app.put("/api/requests/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  try {
    const updated = await RequestModel.findOneAndUpdate(
      { requestId: id },
      { $set: { status, remarks } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

app.delete("/api/requests/:id", async (req,res) => {
  try {
    const deleted = await RequestModel.findOneAndDelete({
      requestId: req.params.id,
    });

    if (!deleted) {
      return res.status(404).json({
        error: "request not found"
      });
    }

    res.json({
      message: "Request deleted successfully", 
      requestId: req.params.id,
    });

} catch (err) {
  res.status(500).json({
    error: "failed to delete request",
    details: err.message,
  });
}
})

// 4. Get settings
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create(defaultSettings);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// 5. Update settings
app.put("/api/settings", async (req, res) => {
  try {
    const updated = await SettingsModel.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// --- RESULTS ENDPOINTS ---
// Get results (optional published filter)
app.get("/api/results", async (req, res) => {
  try {
    const query = req.query.published === "true" ? { isPublished: true } : {};
    const results = await ResultModel.find(query).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Add new result
app.post("/api/results", async (req, res) => {
  try {
    const newResult = new ResultModel({
      ...req.body,
      createdAt: new Date()
    });
    const saved = await newResult.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Update result
app.put("/api/results/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await ResultModel.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ error: "Result not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Delete result
app.delete("/api/results/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await ResultModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Result not found" });
    res.json({ message: "Result deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Publish result toggle
app.put("/api/results/:id/publish", async (req, res) => {
  const { id } = req.params;
  const { isPublished } = req.body;
  try {
    const updated = await ResultModel.findByIdAndUpdate(
      id,
      { $set: { isPublished } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Result not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Recategorize all results based on programme name
app.post("/api/results/recategorize", async (req, res) => {
  const VALID_CATEGORIES = [
    "Union Programs",
    "Outreach",
    "NoticeVerse",
    "Bonus",
    "Publication",
    "DISA Programs"
  ];

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

  try {
    const allResults = await ResultModel.find({});
    let updatedCount = 0;

    const bulkOps = allResults.map((result) => {
      const newCategory = inferCategoryFromName(result.programName);
      updatedCount++;
      return {
        updateOne: {
          filter: { _id: result._id },
          update: { $set: { category: newCategory } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await ResultModel.bulkWrite(bulkOps);
    }

    // Return all updated results
    const updatedResults = await ResultModel.find({}).sort({ createdAt: -1 });
    res.json({
      message: `Recategorized ${updatedCount} result(s) successfully.`,
      updatedCount,
      results: updatedResults
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to recategorize results", details: err.message });
  }
});

// --- MINUS POINTS ENDPOINTS ---
// Get all minus points
app.get("/api/minus-points", async (req, res) => {
  try {
    const minusPoints = await MinusPointModel.find().sort({ createdAt: -1 });
    res.json(minusPoints);
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Add new minus point
app.post("/api/minus-points", async (req, res) => {
  try {
    const newMinus = new MinusPointModel({
      ...req.body,
      createdAt: new Date()
    });
    const saved = await newMinus.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Delete minus point
app.delete("/api/minus-points/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MinusPointModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Minus point record not found" });
    res.json({ message: "Minus point record deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// --- GALLERY ENDPOINTS ---
// Get all gallery items
app.get("/api/gallery", async (req, res) => {
  try {
    const query =
      req.query.published === "true"
        ? { isPublished: true }
        : {};

    const items = await GalleryModel.find(query);

    res.json(items);
  } catch (err) {
    res.status(500).json({
      error: "Gallery fetch failed",
      details: err.message
    });
  }
});

// Add gallery item
const uploadToCloudinary = async (base64Str) => {
  if (!base64Str || !base64Str.startsWith("data:")) {
    return base64Str;
  }
  const result = await cloudinary.uploader.upload(base64Str, {
    folder: "union-media",
    resource_type: "auto",
  });
  return result.secure_url;
};

app.post("/api/gallery", async (req, res) => {
  try {
    let { thumbnail, mediaFile } = req.body;

    if (thumbnail && thumbnail.startsWith("data:")) {
      thumbnail = await uploadToCloudinary(thumbnail);
    }
    if (mediaFile && mediaFile.startsWith("data:")) {
      mediaFile = await uploadToCloudinary(mediaFile);
    }

    const newItem = new GalleryModel({
      ...req.body,
      thumbnail,
      mediaFile,
      createdAt: new Date()
    });
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Update gallery item
app.put("/api/gallery/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await GalleryModel.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ error: "Gallery item not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Delete gallery item
app.delete("/api/gallery/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await GalleryModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Gallery item not found" });
    res.json({ message: "Gallery item deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// --- ANNOUNCEMENTS ENDPOINTS ---
// Get all announcements
app.get("/api/announcements", async (req, res) => {
  try {
    const announcements = await AnnouncementModel.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Add announcement
app.post("/api/announcements", async (req, res) => {
  try {
    const newAnnouncement = new AnnouncementModel({
      ...req.body,
      createdAt: new Date()
    });
    const saved = await newAnnouncement.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// Delete announcement
app.delete("/api/announcements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await AnnouncementModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Announcement deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// --- STUDENTS ENDPOINTS ---
app.get("/api/students/:admissionNo", async (req, res) => {
  try {
    const student = await StudentModel.findOne({ admissionNo: req.params.admissionNo });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});

// --- UPLOAD ENDPOINT ---
app.post("/api/upload/:collection", upload.single('dataset'), async (req, res) => {
  const collectionName = req.params.collection;
  console.log('Upload route hit')
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const modelMap = {
      'requests': RequestModel,
      'settings': SettingsModel,
      'results': ResultModel,
      'minusPoints': MinusPointModel,
      'gallery': GalleryModel,
      'announcements': AnnouncementModel,
      'students': StudentModel
    };

    const Model = modelMap[collectionName];
    if (!Model) { 
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: `Invalid collection name: ${collectionName}` });
    }
    
    const parser = fs.createReadStream(file.path).pipe(csvParser());
    const batchSize = 1000;
    let batch = [];
    let totalInserted = 0;

    for await (const record of parser) {
      batch.push(record);
      if (batch.length >= batchSize) {
        await Model.insertMany(batch);
        totalInserted += batch.length;
        batch = [];
      }
    }

    if (batch.length > 0) {
      await Model.insertMany(batch);
      totalInserted += batch.length;
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.json({ message: `Successfully uploaded ${totalInserted} records to ${collectionName}` });
  } catch (err) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ error: "Upload processing failed", details: err.message });
  }
});

// 6. Seed mock database (Disabled)
app.post("/api/seed", async (req, res) => {
  res.status(400).json({ error: "Mock database seeding is disabled." });
});

// 7. Clear database
app.delete("/api/clear", async (req, res) => {
  try {
    await RequestModel.deleteMany({});
    await ResultModel.deleteMany({});
    await MinusPointModel.deleteMany({});
    await GalleryModel.deleteMany({});
    await AnnouncementModel.deleteMany({});
    await StudentModel.deleteMany({});
    res.json({ message: "Cleared all requests successfully" });
  } catch (err) {
    res.status(500).json({ error: "Wait a minute for loading server", details: err.message });
  }
});


// --- CODE EXECUTION ENDPOINT ---
app.post("/api/execute", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required." });
  }

  const supportedLanguages = ["javascript", "python"];
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ error: `Language '${language}' is not supported. Supported: javascript, python.` });
  }

  const TIMEOUT_MS = 10000; // 10 second timeout
  const tmpDir = os.tmpdir();
  const ext = language === "python" ? ".py" : ".js";
  const tmpFile = path.join(tmpDir, `exec_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);

  try {
    fs.writeFileSync(tmpFile, code, "utf8");

    let cmd, args;
    if (language === "python") {
      cmd = "py";
      args = [tmpFile];
    } else {
      cmd = "node";
      args = [tmpFile];
    }

    const child = spawn(cmd, args, {
      timeout: TIMEOUT_MS,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("close", (code, signal) => {
      try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }

      if (signal === "SIGTERM") {
        return res.json({ stdout: "", stderr: "⏱️ Execution timed out (10s limit).", exitCode: -1 });
      }

      res.json({ stdout, stderr, exitCode: code ?? 0 });
    });

    child.on("error", (err) => {
      try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
      res.status(500).json({ stdout: "", stderr: `Error starting process: ${err.message}`, exitCode: -1 });
    });
  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
    res.status(500).json({ error: "Execution failed: " + err.message });
  }
});


app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "union-media",
    });

    fs.unlinkSync(req.file.path);

    res.json({
      url: result.secure_url,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});