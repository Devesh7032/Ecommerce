const { Client } = require('pg');

async function testSni() {
  const client = new Client({
    user: 'postgres', // Base user
    host: 'aws-0-ap-northeast-1.pooler.supabase.com', // Tokyo IPv4 Pooler
    database: 'postgres',
    password: 'Deveshv@1234',
    port: 6543,
    ssl: {
      rejectUnauthorized: false,
      servername: 'db.okwmhbjqhjqslyqktbll.supabase.co' // Overriding SNI hostname
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected using SNI servername override!");
    const res = await client.query("SELECT version()");
    console.log("Version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`FAILED with SNI override: ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}

testSni();
