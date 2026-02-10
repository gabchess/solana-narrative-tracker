#!/usr/bin/env node
// Main orchestrator — runs all scanners then generates narratives

import { runSocialScan } from './scanners/social.mjs';
import { runGithubScan } from './scanners/github.mjs';
import { runOnchainScan } from './scanners/onchain.mjs';
import { generateNarratives } from './engine/narrative.mjs';
import { supabasePost, SUPABASE_URL, SUPABASE_KEY } from './lib/config.mjs';
import { randomUUID } from 'crypto';

const args = process.argv.slice(2);
const skipSocial = args.includes('--skip-social');
const skipGithub = args.includes('--skip-github');
const skipOnchain = args.includes('--skip-onchain');
const narrativesOnly = args.includes('--narratives-only');

async function runStep(scanType, stepFn) {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const canLogRuns = Boolean(SUPABASE_URL && SUPABASE_KEY);
  if (canLogRuns) {
    await supabasePost('scan_runs', {
      id: runId,
      scan_type: scanType,
      started_at: startedAt,
      status: 'running',
      metadata: { cli_args: args },
    });
  }
  try {
    const result = await stepFn();
    if (canLogRuns) {
      await supabasePost('scan_runs', {
        id: runId,
        scan_type: scanType,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        status: 'completed',
        signals_found: Array.isArray(result) ? result.length : 0,
        metadata: { cli_args: args },
      });
    }
    return { ok: true };
  } catch (e) {
    if (canLogRuns) {
      await supabasePost('scan_runs', {
        id: runId,
        scan_type: scanType,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: e?.message?.substring(0, 500) || 'Unknown error',
        metadata: { cli_args: args },
      });
    }
    return { ok: false, error: e };
  }
}

async function main() {
  console.log('🚀 Solana Narrative Tracker — Full Scan\n');
  console.log(`Period: ${new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0]} → ${new Date().toISOString().split('T')[0]}\n`);
  const failures = [];
  
  if (!narrativesOnly) {
    if (!skipSocial) {
      const result = await runStep('social', runSocialScan);
      if (!result.ok) {
        failures.push(`social: ${result.error?.message || 'unknown failure'}`);
        console.error('Social scan failed:', result.error?.stack || result.error?.message);
      }
      console.log('');
    }
    
    if (!skipGithub) {
      const result = await runStep('github', runGithubScan);
      if (!result.ok) {
        failures.push(`github: ${result.error?.message || 'unknown failure'}`);
        console.error('GitHub scan failed:', result.error?.stack || result.error?.message);
      }
      console.log('');
    }
    
    if (!skipOnchain) {
      const result = await runStep('onchain', runOnchainScan);
      if (!result.ok) {
        failures.push(`onchain: ${result.error?.message || 'unknown failure'}`);
        console.error('Onchain scan failed:', result.error?.stack || result.error?.message);
      }
      console.log('');
    }
  }
  
  // Generate narratives from collected signals
  {
    const result = await runStep('narrative_gen', generateNarratives);
    if (!result.ok) {
      failures.push(`narrative_gen: ${result.error?.message || 'unknown failure'}`);
      console.error('Narrative generation failed:', result.error?.stack || result.error?.message);
    }
  }
  
  if (failures.length) {
    console.error('\n⚠️ Scan completed with failures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\n✅ Full scan complete!');
  }
}

main().catch(console.error);
