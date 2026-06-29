const { Client } = require('pg');

async function testAws1() {
  const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
  const projectId = 'okwmhbjqhjqslyqktbll';
  const password = 'Deveshv@1234';
  
  const client = new Client({
    user: `postgres.${projectId}`,
    host: host,
    database: 'postgres',
    password: password,
    port: 6543,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected to aws-1-ap-northeast-1 on port 6543!");
    const res = await client.query("SELECT version()");
    console.log("Version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`FAILED on aws-1: ${err.message}`);
    try { await client.end(); } catch(e) {}
    
    // Also try port 5432
    const client5432 = new Client({
      user: `postgres.${projectId}`,
      host: host,
      database: 'postgres',
      password: password,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client5432.connect();
      console.log("SUCCESS: Connected to aws-1-ap-northeast-1 on port 5432!");
      const res = await client5432.query("SELECT version()");
      console.log("Version:", res.rows[0]);
      await client5432.end();
    } catch (err5432) {
      console.log(`FAILED on aws-1 port 5432: ${err5432.message}`);
      try { await client5432.end(); } catch(e) {}
    }
  }
}

testAws1();
