require("dotenv/config");
const express = require("express");
const cors = require("cors");

const routes = require('./routes')

require("./jobs/cron");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

app.use(cors({ origin: ["http://localhost:3001", frontendUrl], credentials: true }));
app.use(express.json());

app.use("/v1/api", routes);

app.listen(PORT, () => {
  console.log(`✅ AdPulse AI backend running on port ${PORT}`);
});