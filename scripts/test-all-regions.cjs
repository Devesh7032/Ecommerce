const { Client } = require('pg');
const dns = require('dns');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'af-south-1', 'ap-east-1', 'ap-south-1', 'ap-south-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-southeast-4',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ca-central-1', 'eu-central-1', 'eu-central-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-south-1', 'eu-south-2', 'eu-north-1',
  'me-central-1', 'me-south-1', 'sa-east-1'
];

const password = encodeURIComponent("Deveshv@1234");
const projectId = "okwmhbjqhjqslyqktbll";

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  
  // First check if DNS resolves
  return new Promise((resolve) => {
    dns.resolve(host, async (err) => {
      if (err) {
        // Doesn't resolve, ignore
        resolve(null);
        return;
      }
      
      // If DNS resolves, try to connect on port 6543
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
        resolve(region);
      } catch (connErr) {
        // Log connection error to see why it failed
        console.log(`DNS ok, connection failed for ${region}: ${connErr.message}`);
        try { await client.end(); } catch(e) {}
        resolve(null);
      }
    });
  });
}

async function main() {
  console.log("Testing all global regional poolers...");
  const results = await Promise.all(regions.map(testRegion));
  const success = results.filter(Boolean);
  console.log("Successful regions:", success);
}

main();
