const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { createCompany, getCompany, updateCompany } = require("../controllers/company.controller");

router.post("/company", requireAuth, createCompany);
router.get("/company", requireAuth, getCompany);
router.put("/company", requireAuth, updateCompany);

module.exports = router;
