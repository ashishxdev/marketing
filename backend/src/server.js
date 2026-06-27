require("dotenv/config");
const express = require("express");
const cors = require("cors");

const companyRoutes = require("./routes/company.routes");
const connectionRoutes = require("./routes/connection.routes");
const campaignRoutes = require("./routes/campaigns.routes");
const reportRoutes = require("./routes/reports.routes");
const metaRoutes = require("./routes/meta.routes");
const googleRoutes = require("./routes/google.routes");

require("./jobs/cron");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

app.use(cors({ origin: ["http://localhost:3001", frontendUrl], credentials: true }));
app.use(express.json());

app.use("/api/company", companyRoutes);
app.use("/api/connection-status", connectionRoutes);
app.use("/api", campaignRoutes);
app.use("/api", reportRoutes);
app.use("/", metaRoutes);
app.use("/", googleRoutes);

app.listen(PORT, () => {
  console.log(`✅ AdPulse AI backend running on port ${PORT}`);
});