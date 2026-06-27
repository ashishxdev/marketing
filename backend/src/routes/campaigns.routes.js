const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { getAccounts, getCampaigns } = require("../controllers/campaigns.controller");

router.get("/accounts", requireAuth, getAccounts);
router.get("/campaigns", requireAuth, getCampaigns);

module.exports = router;
