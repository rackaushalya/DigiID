const express = require("express");
const router = express.Router();
const c = require("../controllers/citizenController");

router.post("/citizens", c.createCitizen);
router.get("/citizens", c.getAllCitizens);
router.get("/citizens/:ndiId", c.getCitizenByNdiId);
router.put("/citizens/:ndiId", c.updateCitizenByNdiId);
router.delete("/citizens/:ndiId", c.deleteCitizenByNdiId);

module.exports = router;
