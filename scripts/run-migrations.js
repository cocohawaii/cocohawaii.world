/**
 * Run Supabase migrations automatically.
 *
 * Setup:
 * 1. Get your database password from Supabase Dashboard → Project Settings → Database
 * 2. Add to .env.local:
 *    SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wcnalqnkvspthewjyhqt.supabase.co:5432/postgres
 *    (Replace [YOUR-PASSWORD] with your actual database password)
 *
 * Run: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

async function run() {
  const { Client } = require('pg');

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error(`
Missing SUPABASE_DB_URL in .env.local

To get it:
1. Go to https://supabase.com/dashboard
2. Select your project → Project Settings → Database
3. Copy the "Connection string" (URI) - use "Direct connection" or "Session mode"
4. Add to .env.local:
   SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wcnalqnkvspthewjyhqt.supabase.co:5432/postgres

Then run: node scripts/run-migrations.js
`);
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to Supabase.\n');

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running ${file}...`);
      try {
        await client.query(sql);
        console.log(`  ✓ ${file}\n`);
      } catch (err) {
        if (err.message.includes('already exists') || err.code === '42P07' || err.code === '42710') {
          console.log(`  ⏭ Skipped (already applied): ${file}\n`);
        } else {
          throw err;
        }
      }
    }
    console.log('All migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
