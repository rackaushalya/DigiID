/**
 * app.js - Simple Express + MongoDB server for Citizens
 * Runs: http://localhost:3000
 *
 * Routes:
 *   GET  /citizens              -> findAll()
 *   GET  /citizens/:id          -> findOne() by Mongo _id
 *   POST /citizens/findOne      -> findOne() by body fields (id / nic / email / etc.)
 *   POST /citizens              -> create citizen (optional for testing)
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

// ✅ middleware
app.use(cors());
app.use(express.json());

// ✅ OPTIONAL: serve frontend files (so you can open http://localhost:3000/index.html)
app.use(express.static(path.join(__dirname, "../")));

// =====================
// MongoDB Connection
// =====================
// Example: mongodb://127.0.0.1:27017
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "ecitizen";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "citizens";

let citizensCollection;

async function connectMongo() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    citizensCollection = db.collection(COLLECTION_NAME);
    console.log(`✅ MongoDB connected: ${MONGO_URI} / ${DB_NAME}.${COLLECTION_NAME}`);
}

// =====================
// Helpers
// =====================
function isValidObjectId(id) {
    return typeof id === "string" && ObjectId.isValid(id);
}

// =====================
// Routes
// =====================

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * ✅ findAll()
 * GET /citizens
 */
app.get("/citizens", async (req, res) => {
    try {
        // Optional query search: /citizens?name=kamal
        const { name, nic, email } = req.query;

        const filter = {};
        if (nic) filter.nic = nic;
        if (email) filter.email = email;

        // Search by name across fullName OR firstName OR lastName
        if (name) {
            filter.$or = [
                { fullName: { $regex: name, $options: "i" } },
                { firstName: { $regex: name, $options: "i" } },
                { lastName: { $regex: name, $options: "i" } },
            ];
        }


        const list = await citizensCollection.find(filter).toArray();
        return res.json({ ok: true, count: list.length, data: list });
    } catch (err) {
        console.error("❌ GET /citizens error:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
});

/**
 * ✅ findOne() by _id
 * GET /citizens/:id
 */
app.get("/citizens/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid MongoDB _id" });
        }

        const citizen = await citizensCollection.findOne({ _id: new ObjectId(id) });

        if (!citizen) {
            return res.status(404).json({ ok: false, message: "Citizen not found" });
        }

        return res.json({ ok: true, data: citizen });
    } catch (err) {
        console.error("❌ GET /citizens/:id error:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
});

/**
 * ✅ findOne() using POST body
 * POST /citizens/findOne
 *
 * Body examples:
 *  { "id": "65b..." }                 -> search by _id
 *  { "nic": "200012345678" }          -> search by nic
 *  { "email": "a@b.com" }             -> search by email
 *  { "name": "Kamal" }                -> exact match by name
 */
app.post("/citizens/findOne", async (req, res) => {
    try {
        const { id, nic, email, NDI_ID } = req.body || {};

        // Allow searching using either nic OR NDI_ID from frontend
        const ndi = nic || NDI_ID;

        let filter = null;

        if (id) {
            if (!isValidObjectId(id)) {
                return res.status(400).json({ ok: false, message: "Invalid MongoDB _id" });
            }
            filter = { _id: new ObjectId(id) };
        } else if (ndi) {
            filter = { nic: ndi };
        } else if (email) {
            filter = { email };
        } else {
            return res.status(400).json({
                ok: false,
                message: "Provide id OR nic/NDI_ID OR email to search",
            });
        }

        const citizen = await citizensCollection.findOne(filter);

        if (!citizen) {
            return res.status(404).json({ ok: false, message: "Citizen not found" });
        }

        return res.json({ ok: true, data: citizen });
    } catch (err) {
        console.error("❌ POST /citizens/findOne error:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
});


/**
 * ✅ OPTIONAL: Create citizen (useful for testing quickly with AJAX)
 * POST /citizens
 */
app.post("/citizens", async (req, res) => {
  try {
    const body = req.body || {};

    // Accept both naming styles (frontend IDs vs backend fields)
    const nic = (body.nic || body.NDI_ID || "").trim();
    const firstName = (body.firstName || body.FirstName || "").trim();
    const lastName = (body.lastName || body.LastName || "").trim();
    const dob = (body.dob || body.DoB || "").trim();
    const email = (body.email || body.Email || "").trim();
    const phone = (body.phone || body.Phone || "").trim();

    const occupation = (body.occupation || body.Occupation || "").trim();
    const nationality = (body.nationality || body.Nationality || "").trim();
    const bloodGroup = (body.bloodGroup || body.Blood_Group || "").trim();

    const fullName = (body.fullName || `${firstName} ${lastName}`.trim()).trim();

    // Validation (minimum)
    if (!nic || !firstName || !lastName || !dob || !email || !phone || !nationality || !bloodGroup) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: NDI_ID, FirstName, LastName, DoB, Email, Phone, Nationality, Blood_Group",
      });
    }

    // Prevent duplicate NIC
    const exists = await citizensCollection.findOne({ nic });
    if (exists) {
      return res.status(409).json({ ok: false, message: "Citizen already exists with this NDI/NIC" });
    }

    const doc = {
      nic,
      firstName,
      lastName,
      fullName,
      dob,
      email,
      phone,
      occupation,
      nationality,
      bloodGroup,
      createdAt: new Date(),
    };

    const result = await citizensCollection.insertOne(doc);

    return res.status(201).json({
      ok: true,
      message: "Citizen created",
      insertedId: result.insertedId,
      data: doc,
    });
  } catch (err) {
    console.error("❌ POST /citizens error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});




app.delete("/citizens/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid MongoDB _id" });
    }

    const result = await citizensCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: "Citizen not found" });
    }

    return res.json({ ok: true, message: "Citizen deleted" });
  } catch (err) {
    console.error("❌ DELETE /citizens/:id error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});



app.put("/citizens/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid MongoDB _id" });
    }


    
    const body = req.body || {};

    // Accept either frontend naming or backend naming
    const update = {
      nic: (body.nic || body.NDI_ID || "").trim(),
      firstName: (body.firstName || body.FirstName || "").trim(),
      lastName: (body.lastName || body.LastName || "").trim(),
      fullName: (body.fullName || `${(body.firstName || body.FirstName || "").trim()} ${(body.lastName || body.LastName || "").trim()}`.trim()).trim(),
      dob: (body.dob || body.DoB || "").trim(),
      email: (body.email || body.Email || "").trim(),
      phone: (body.phone || body.Phone || "").trim(),
      occupation: (body.occupation || body.Occupation || "").trim(),
      nationality: (body.nationality || body.Nationality || "").trim(),
      bloodGroup: (body.bloodGroup || body.Blood_Group || "").trim(),
      updatedAt: new Date(),
    };

    const result = await citizensCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: "Citizen not found" });
    }

    return res.json({ ok: true, message: "Citizen updated" });
  } catch (err) {
    console.error("❌ PUT /citizens/:id error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});



// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 3000;

connectMongo()
    .then(() => {
        app.listen(PORT, () => console.log(`✅ Server running http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("❌ DB connection error:", err.message);
        process.exit(1);
    });
