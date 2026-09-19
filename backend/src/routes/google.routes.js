const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { googleLogin } = require("../controllers/google.controller");

router.get("/connections/google", requireAuth, googleLogin);

module.exports = router;
