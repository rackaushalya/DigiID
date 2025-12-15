const mongoose = require("mongoose");

const citizenSchema = new mongoose.Schema(
  {
    NDI_ID: { type: String, required: true, unique: true, trim: true },

    FirstName: { type: String, required: true, trim: true },
    LastName: { type: String, required: true, trim: true },

    DoB: { type: String, required: true, trim: true }, // "20-11-2000"
    Email: { type: String, required: true, trim: true },
    Phone: { type: String, required: true, trim: true },

    Occupation: { type: [String], default: [] }, // ["Software Engineer", "SCU"]
    Nationality: { type: String, required: true, trim: true },
    Blood_Group: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Citizen", citizenSchema);
