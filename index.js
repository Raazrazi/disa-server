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
import multer from "multer";
import csvParser from "csv-parser";

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

// Seed data
const initialMockRequests = [
  {
    requestId: "REQ-2026-001",
    programName: "Mock Hajj Demonstration",
    programTitle: "Labbaik Awareness Campaign",
    venue: "Main Auditorium & Courtyard",
    committee: "Hajj Campaign Committee",
    category: "Cultural",
    description: "An awareness and practical demonstration program to educate students and public about the rituals and spiritual significance of Hajj. Will feature a mock Kaaba structure setup.",
    posterRequirements: "Include clean, high-resolution calligraphy and elegant Islamic architecture outline. Avoid cluttered details. Physical flex print required (10x8ft).",
    contactPerson: "Muhammed Ameen",
    email: "muhammed.ameen@union.edu",
    eventDateTime: "2026-06-25T10:00",
    priority: "High",
    status: "Pending",
    remarks: "Awaiting final layout confirmation from organizing secretary.",
    createdAt: new Date("2026-06-05T09:30:00Z")
  }
];

const initialMockResults = [
  {
    programName: "Debate Competition",
    studentName: "Muhammed",
    className: "WIDAD",
    prize: "1st",
    points: 10,
    isPublished: true,
    createdAt: new Date("2026-06-05T10:00:00Z")
  },
  {
    programName: "Essay Writing",
    studentName: "Ameen",
    className: "IFADA",
    prize: "2nd",
    points: 7,
    isPublished: true,
    createdAt: new Date("2026-06-06T14:30:00Z")
  },
  {
    programName: "Quiz Competition",
    studentName: "Nihad",
    className: "WAFD",
    prize: "3rd",
    points: 5,
    isPublished: true,
    createdAt: new Date("2026-06-07T09:00:00Z")
  },
  {
    programName: "Coding Contest",
    studentName: "Fathima",
    className: "ITHIHAD",
    prize: "1st",
    points: 10,
    isPublished: false,
    createdAt: new Date("2026-06-08T11:00:00Z")
  }
];

const initialMockMinusPoints = [
  {
    className: "WIDAD",
    reason: "Late Submission of Poster Request REQ-2026-003",
    points: 5,
    approvedBy: "Ahmed Jasim",
    date: "2026-06-07",
    createdAt: new Date("2026-06-07T08:00:00Z")
  },
  {
    className: "IFADA",
    reason: "Rule Violation in Sports Flex Setup",
    points: 3,
    approvedBy: "Prof. K. A. Rahman",
    date: "2026-06-06",
    createdAt: new Date("2026-06-06T12:00:00Z")
  }
];

const initialMockGallery = [
  {
    title: "Mock Hajj Poster",
    description: "Elegant calligraphy poster designed for Hajj awareness seminar.",
    category: "Posters",
    thumbnail: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=60",
    mediaFile: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=60",
    isFeatured: true,
    isPublished: true,
    createdAt: new Date("2026-06-05T09:30:00Z")
  },
  {
    title: "World Cup Tactics Post",
    description: "Social media feed graphics containing match analytics and squad layout.",
    category: "Posts",
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60",
    mediaFile: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60",
    isFeatured: true,
    isPublished: true,
    createdAt: new Date("2026-06-06T14:15:00Z")
  },
  {
    title: "Eco Campaign Reel Video",
    description: "Promotional short video for tree plantation drive around campus walls.",
    category: "Videos",
    thumbnail: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=60",
    mediaFile: "https://www.w3schools.com/html/mov_bbb.mp4",
    isFeatured: false,
    isPublished: true,
    createdAt: new Date("2026-06-04T10:00:00Z")
  }
];

const initialMockAnnouncements = [
  {
    title: "Poster Registration Mandatory Deadline Reminder",
    content: "Please ensure all publicity design poster requests are registered in the queue strictly 48 hours prior to event scheduled timings. Late applications will be automatically blocked by the system validation checks.",
    date: "2026-06-08",
    isImportant: true,
    createdAt: new Date("2026-06-08T09:00:00Z")
  },
  {
    title: "Championship Leaderboard is Live",
    content: "Championship leaderboard statistics and aggregate net points are calculated in real time. Inspect your class standings on the public portal dashboard.",
    date: "2026-06-08",
    isImportant: false,
    createdAt: new Date("2026-06-08T10:00:00Z")
  }
];

const initialMockStudents = [
  { admissionNo: "ADM001", studentName: "Muhammed Ameen", className: "WIDAD" },
  { admissionNo: "ADM002", studentName: "Nihad", className: "WAFD" },
  { admissionNo: "ADM003", studentName: "Fathima", className: "ITHIHAD" },
  { admissionNo: "ADM004", studentName: "Ahmed Jasim", className: "WIDAD" }
];

const defaultSettings = {
  portalName: "Students Union Media Portal",
  chairman: "Ahmed Jasim",
  deadline: 48,
  email: "media.chairman.disa@gmail.com"
};

// Database Initialization helper
async function initializeDatabase() {
  try {
    const requestCount = await RequestModel.countDocuments();
    if (requestCount === 0) {
      console.log("No requests found. Seeding initial mock requests to MongoDB...");
      await RequestModel.insertMany(initialMockRequests);
    }

    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      console.log("No settings found. Seeding default system settings to MongoDB...");
      await SettingsModel.create(defaultSettings);
    }

    const resultCount = await ResultModel.countDocuments();
    if (resultCount === 0) {
      console.log("No results found. Seeding initial mock results to MongoDB...");
      await ResultModel.insertMany(initialMockResults);
    }

    const minusCount = await MinusPointModel.countDocuments();
    if (minusCount === 0) {
      console.log("No minus points found. Seeding initial mock minus points to MongoDB...");
      await MinusPointModel.insertMany(initialMockMinusPoints);
    }

    const galleryCount = await GalleryModel.countDocuments();
    if (galleryCount === 0) {
      console.log("No gallery items found. Seeding initial mock gallery to MongoDB...");
      await GalleryModel.insertMany(initialMockGallery);
    }

    const announcementCount = await AnnouncementModel.countDocuments();
    if (announcementCount === 0) {
      console.log("No announcements found. Seeding initial mock announcements to MongoDB...");
      await AnnouncementModel.insertMany(initialMockAnnouncements);
    }

    const studentCount = await StudentModel.countDocuments();
    if (studentCount === 0) {
      console.log("No students found. Seeding initial mock students to MongoDB...");
      await StudentModel.insertMany(initialMockStudents);
    }
  } catch (err) {
    console.error("Database seeding failure during initialization:", err);
  }
}

// REST Endpoints

// 1. Get all requests
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await RequestModel.find().sort({ createdAt: -1 });
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
app.post("/api/gallery", async (req, res) => {
  try {
    const newItem = new GalleryModel({
      ...req.body,
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

// 6. Seed mock database
app.post("/api/seed", async (req, res) => {
  try {
    await RequestModel.deleteMany({});
    await SettingsModel.deleteMany({});
    await ResultModel.deleteMany({});
    await MinusPointModel.deleteMany({});
    await GalleryModel.deleteMany({});
    await AnnouncementModel.deleteMany({});
    await StudentModel.deleteMany({});
    
    await RequestModel.insertMany(initialMockRequests);
    const settings = await SettingsModel.create(defaultSettings);
    await ResultModel.insertMany(initialMockResults);
    await MinusPointModel.insertMany(initialMockMinusPoints);
    await GalleryModel.insertMany(initialMockGallery);
    await AnnouncementModel.insertMany(initialMockAnnouncements);
    await StudentModel.insertMany(initialMockStudents);
    
    res.json({ message: "Seeded database successfully", settings });
  } catch (err) {
    res.status(500).json({ error: "Seeding failed", details: err.message });
  }
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


