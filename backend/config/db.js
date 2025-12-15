const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) throw new Error("MongoDB URI missing. Add MONGO_URI in .env");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}

module.exports = connectDB;
