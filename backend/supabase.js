require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

// Use service role key so backend cron jobs bypass RLS
// (service role key is secret — never expose it to the frontend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY,
  {
    realtime: {
      transport: ws,
    },
  }
);

module.exports = supabase;