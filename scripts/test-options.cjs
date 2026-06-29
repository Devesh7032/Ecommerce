const { Client } = require('pg');

async function testOptions() {
  const client = new Client({
    user: 'postgres.okwmhbjqhjqslyqktbll',
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Deveshv@1234',
    port: 6543,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected using options object!");
    const res = await client.query("SELECT version()");
    console.log("Version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`FAILED with options: ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}

testOptions();
