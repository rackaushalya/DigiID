const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");
const citizenRoutes = require("./routes/citizenRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// API
app.use("/api", citizenRoutes);

// Serve frontend (so links work + no CORS pain)
app.use(express.static(path.join(__dirname, "../frontend")));

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });
