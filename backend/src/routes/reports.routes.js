const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { getReports, generateReport } = require("../controllers/reports.controller");

router.get("/reports", requireAuth, getReports);
router.post("/reports/generate", requireAuth, generateReport);

module.exports = router;
