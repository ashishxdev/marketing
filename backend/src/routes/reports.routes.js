const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { getReports, testGenerateReport } = require("../controllers/reports.controller");

router.get("/reports", requireAuth, getReports);
router.get("/test-generate-report", testGenerateReport);

module.exports = router;
