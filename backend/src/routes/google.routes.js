const express = require("express");
const router = express.Router();
const { googleLogin, googleCallback } = require("../controllers/google.controller");

router.get("/google-login", googleLogin);
router.get("/callback-google", googleCallback);

module.exports = router;
