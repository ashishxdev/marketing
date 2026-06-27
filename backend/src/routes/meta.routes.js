const express = require("express");
const router = express.Router();
const { metaLogin, metaCallback, metaDeleteUser } = require("../controllers/meta.controller");

router.get("/login", metaLogin);
router.get("/callback", metaCallback);
router.post("/meta-delete-user", metaDeleteUser);

module.exports = router;
