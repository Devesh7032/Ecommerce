const { Client } = require('pg');

async function testCombination() {
  const client = new Client({
    user: 'postgres.okwmhbjqhjqslyqktbll',
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Deveshv@1234',
    port: 6543,
    ssl: {
      rejectUnauthorized: false,
      servername: 'db.okwmhbjqhjqslyqktbll.supabase.co'
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected using user + SNI combination!");
    const res = await client.query("SELECT version()");
    console.log("Version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`FAILED with combination: ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}

testCombination();
