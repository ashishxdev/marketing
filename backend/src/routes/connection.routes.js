const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { getConnectionStatus } = require("../controllers/connection.controller");

router.get("/connection-status", requireAuth, getConnectionStatus);

module.exports = router;
