const { Client } = require('pg');

const connectionString = "postgresql://postgres:Deveshv%401234@[2406:da14:311:1501:d8d9:fccd:126f:48fa]:5432/postgres";

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("SUCCESS: Connected directly via IPv6 IP!");
    const res = await client.query("SELECT version()");
    console.log(res.rows[0]);
  } catch (err) {
    console.error("FAILED: Direct connection via IP failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
