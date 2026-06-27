const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { createCompany, getCompany, updateCompany } = require("../controllers/company.controller");

router.post("/", requireAuth, createCompany);
router.get("/", requireAuth, getCompany);
router.put("/", requireAuth, updateCompany);

module.exports = router;
