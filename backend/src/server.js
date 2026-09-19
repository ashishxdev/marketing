require("dotenv/config");
const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { metaCallback } = require("./controllers/meta.controller");
const { googleCallback } = require("./controllers/google.controller");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

app.use(cors({ origin: ["http://localhost:3001", frontendUrl], credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Keep /api for existing clients and expose the versioned route added upstream.
app.use("/api", routes);
app.use("/v1/api", routes);

// OAuth providers require stable, top-level callback URLs.
app.get("/callback", metaCallback);
app.get("/callback-google", googleCallback);

if (require.main === module) {
  require("./jobs/cron");
  app.listen(PORT, () => {
    console.log(`✅ AdPulse AI backend running on port ${PORT}`);
  });
}

module.exports = app;
