#!/usr/bin/env node
// Deploy schema to Supabase using individual table creation via REST
// Since we can't run raw SQL, we'll create a pg function first, then call it

import { SUPABASE_URL, SUPABASE_KEY } from './lib/config.mjs';
import { readFileSync } from 'fs';

const sql = readFileSync('./supabase/schema.sql', 'utf8');

// Create exec_sql function first, then use it
async function setup() {
  // Step 1: Create a helper function
  const createFn = `
    CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$
    BEGIN EXECUTE query; END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  // Try via pg-meta
  const pgMetaRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: createFn }),
  });
  
  console.log('Create fn attempt:', pgMetaRes.status);
  
  if (pgMetaRes.status === 404 || pgMetaRes.status === 400) {
    console.log('\nCannot create functions via REST API.');
    console.log('Please run the following SQL in your Supabase SQL editor:');
    console.log('URL: https://supabase.com/dashboard/project/qmgxvmzydxxlfuxmfswy/sql/new\n');
    console.log('--- COPY BELOW ---\n');
    console.log(sql);
    console.log('\n--- END ---\n');
    
    // Also add RLS policies
    const rlsSQL = `
-- Enable RLS on new tables
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_all" ON social_signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON github_signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON onchain_signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON narratives FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON scan_runs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON reports FOR ALL USING (auth.role() = 'service_role');

-- Public read on narratives and reports (for dashboard)
CREATE POLICY "public_read" ON narratives FOR SELECT USING (true);
CREATE POLICY "public_read" ON reports FOR SELECT USING (true);
CREATE POLICY "public_read" ON social_signals FOR SELECT USING (true);
CREATE POLICY "public_read" ON github_signals FOR SELECT USING (true);
CREATE POLICY "public_read" ON onchain_signals FOR SELECT USING (true);
`;
    console.log(rlsSQL);
    
    // Output as data URI for easy paste
    const combined = sql + '\n' + rlsSQL;
    console.log('\n📋 Or open this data URI in your browser:\n');
    console.log('data:text/plain;base64,' + Buffer.from(combined).toString('base64'));
  }
}

setup().catch(console.error);
