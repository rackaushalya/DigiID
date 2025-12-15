const Citizen = require("../models/Citizen");

// POST /api/citizens  (Insert Citizen)
exports.createCitizen = async (req, res) => {
  try {
    const data = req.body;

    if (!data.NDI_ID) return res.status(400).json({ message: "NDI_ID required" });

    // Prevent duplicates
    const exists = await Citizen.findOne({ NDI_ID: String(data.NDI_ID).trim() });
    if (exists) return res.status(409).json({ message: "Citizen already exists for this NDI_ID" });

    const citizen = await Citizen.create({
      ...data,
      NDI_ID: String(data.NDI_ID).trim(),
      Occupation: Array.isArray(data.Occupation)
        ? data.Occupation
        : String(data.Occupation || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
    });

    res.status(201).json(citizen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/citizens (Show all)
exports.getAllCitizens = async (req, res) => {
  try {
    const citizens = await Citizen.find().sort({ createdAt: -1 });
    res.json(citizens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/citizens/:ndiId (Find by NDI ID)
exports.getCitizenByNdiId = async (req, res) => {
  try {
    const citizen = await Citizen.findOne({ NDI_ID: req.params.ndiId });
    if (!citizen) return res.status(404).json({ message: "Citizen not found" });
    res.json(citizen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/citizens/:ndiId (Update citizen by NDI ID)
exports.updateCitizenByNdiId = async (req, res) => {
  try {
    const updates = req.body;

    // If Occupation comes as "a,b,c", convert to array
    if (updates.Occupation && !Array.isArray(updates.Occupation)) {
      updates.Occupation = String(updates.Occupation)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }

    const citizen = await Citizen.findOneAndUpdate(
      { NDI_ID: req.params.ndiId },
      { $set: updates },
      { new: true }
    );

    if (!citizen) return res.status(404).json({ message: "Citizen not found" });
    res.json(citizen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/citizens/:ndiId (Delete by NDI ID)
exports.deleteCitizenByNdiId = async (req, res) => {
  try {
    const deleted = await Citizen.findOneAndDelete({ NDI_ID: req.params.ndiId });
    if (!deleted) return res.status(404).json({ message: "Citizen not found" });
    res.json({ message: "Citizen deleted", NDI_ID: deleted.NDI_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
