const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/auth.controller");

router.post("/auth/signup", signup);

module.exports = router;
