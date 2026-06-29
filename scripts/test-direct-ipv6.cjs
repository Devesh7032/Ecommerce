const { Client } = require('pg');

const connectionString = "postgresql://postgres:Deveshv%401234@db.okwmhbjqhjqslyqktbll.supabase.co:5432/postgres";

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("SUCCESS: Connected directly via IPv6!");
    const res = await client.query("SELECT version()");
    console.log(res.rows[0]);
  } catch (err) {
    console.error("FAILED: Direct connection failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
