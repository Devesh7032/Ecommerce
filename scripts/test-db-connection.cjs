const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-central-1', 'eu-central-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1'
];
const password = encodeURIComponent("Deveshv@1234");
const projectId = "okwmhbjqhjqslyqktbll";

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected to ${region} on port 6543`);
    await client.end();
    return region;
  } catch (err) {
    if (err.message.includes('tenant/user')) {
      return null; // Silent for invalid tenants
    }
    console.log(`FAILED: ${region} on port 6543 - ${err.message}`);
    try { await client.end(); } catch(e) {}
    return null;
  }
}

async function main() {
  console.log("Testing all regional poolers with URL encoded password...");
  const results = await Promise.all(regions.map(testRegion));
  const success = results.filter(Boolean);
  console.log("Successful regions:", success);
}

main();
