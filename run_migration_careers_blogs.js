const fs = require('fs');
const { Client } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found in env, attempting to read from .env");
    try {
      const envFile = fs.readFileSync('.env', 'utf8');
      const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
      }
    } catch(e) {}
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase_careers_blogs.sql', 'utf8');
    await client.query(sql);
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
