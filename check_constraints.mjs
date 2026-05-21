import('pg').then(({ default: pg }) => {
  const { Client } = pg;
  const connStr = process.env.SUPABASE_DB_URL;
  if (!connStr) { console.error('SUPABASE_DB_URL nicht gesetzt'); process.exit(1); }
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  client.connect().then(() => {
    return client.query(`
      SELECT 
        n.nspname as schema,
        t.relname as table,
        pg_get_constraintdef(c.oid) as constraint_def,
        c.conname as constraint_name
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'availabilities'
        AND c.contype = 'c'
        AND n.nspname IN ('teamradar-dev','teamradar-test','teamradar-prod')
      ORDER BY n.nspname
    `);
  }).then(r => {
    console.log(JSON.stringify(r.rows, null, 2));
    return client.end();
  }).catch(e => { console.error(e.message); client.end(); });
});
