const express = require("express")
const router = express.Router();

const companyRoutes = require("./company.routes");
const connectionRoutes = require("./connection.routes");
const campaignRoutes = require("./campaigns.routes");
const reportRoutes = require("./reports.routes");
const metaRoutes = require("./meta.routes");
const googleRoutes = require("./google.routes");

router.use(companyRoutes)
router.use(connectionRoutes)
router.use(campaignRoutes)
router.use(reportRoutes)
router.use(metaRoutes)
router.use(googleRoutes)

module.exports = router;