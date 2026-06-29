const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres.okwmhbjqhjqslyqktbll:Deveshv%401234@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database via aws-1-ap-northeast-1!");

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
