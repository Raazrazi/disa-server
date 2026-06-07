import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import RequestModel from "./models/Request.js";
import SettingsModel from "./models/Settings.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/union-media";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully at:", MONGODB_URI);
    initializeDatabase();
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
  });

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
    res.status(400).json({ error: "Failed to update status", details: err.message });
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
    res.status(500).json({ error: "Failed to fetch settings", details: err.message });
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
    res.status(400).json({ error: "Failed to save settings", details: err.message });
  }
});

// 6. Seed mock database
app.post("/api/seed", async (req, res) => {
  try {
    await RequestModel.deleteMany({});
    await SettingsModel.deleteMany({});
    
    await RequestModel.insertMany(initialMockRequests);
    const settings = await SettingsModel.create(defaultSettings);
    
    res.json({ message: "Seeded database successfully", settings });
  } catch (err) {
    res.status(500).json({ error: "Seeding failed", details: err.message });
  }
});

// 7. Clear database
app.delete("/api/clear", async (req, res) => {
  try {
    await RequestModel.deleteMany({});
    res.json({ message: "Cleared all requests successfully" });
  } catch (err) {
    res.status(500).json({ error: "Clear operation failed", details: err.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Union Media Server is actively listening on port ${PORT}`);
});
