const { Client } = require('pg');

const region = 'ap-northeast-1';
const password = encodeURIComponent("Deveshv@1234");
const host = `aws-0-${region}.pooler.supabase.com`;

async function testUser(username) {
  const connectionString = `postgresql://${username}:${password}@${host}:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected using username ${username}`);
    await client.end();
  } catch (err) {
    console.log(`FAILED: username ${username} - ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}

async function main() {
  await testUser('postgres');
  await testUser('postgres.okwmhbjqhjqslyqktbll');
}

main();
