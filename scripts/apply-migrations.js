const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// URL encode password character '@' as '%40'
const connectionString = "postgresql://postgres:Deveshv%401234@db.okwmhbjqhjqslyqktbll.supabase.co:5432/postgres";

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL or it might fail without it
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database!");

    const sqlPath = path.join(__dirname, '../supabase/migrations/20260619000000_init_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migrations...");
    await client.query(sql);
    console.log("Migrations applied successfully!");

  } catch (error) {
    console.error("Error applying migrations:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
