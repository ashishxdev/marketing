const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { getCampaigns } = require("../controllers/campaigns.controller");

router.get("/campaigns", requireAuth, getCampaigns);

module.exports = router;
