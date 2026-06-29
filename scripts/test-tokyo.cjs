const { Client } = require('pg');

const region = 'ap-northeast-1';
const password = encodeURIComponent("Deveshv@1234");
const projectId = "okwmhbjqhjqslyqktbll";
const host = `aws-0-${region}.pooler.supabase.com`;

async function testPort(port) {
  const connectionString = `postgresql://postgres.${projectId}:${password}@${host}:${port}/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected to ${region} on port ${port}`);
    const res = await client.query("SELECT version()");
    console.log("Version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`FAILED: ${region} on port ${port} - ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}

async function main() {
  console.log(`Testing host: ${host}`);
  await testPort(6543);
  await testPort(5432);
}

main();
