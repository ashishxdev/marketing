const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { metaLogin, metaDeleteUser } = require("../controllers/meta.controller");

router.get("/connections/meta", requireAuth, metaLogin);
router.post("/meta-delete-user", metaDeleteUser);

module.exports = router;
