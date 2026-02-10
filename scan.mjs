#!/usr/bin/env node
// Main orchestrator — runs all scanners then generates narratives

import { runSocialScan } from './scanners/social.mjs';
import { runGithubScan } from './scanners/github.mjs';
import { runOnchainScan } from './scanners/onchain.mjs';
import { generateNarratives } from './engine/narrative.mjs';

const args = process.argv.slice(2);
const skipSocial = args.includes('--skip-social');
const skipGithub = args.includes('--skip-github');
const skipOnchain = args.includes('--skip-onchain');
const narrativesOnly = args.includes('--narratives-only');

async function main() {
  console.log('🚀 Solana Narrative Tracker — Full Scan\n');
  console.log(`Period: ${new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0]} → ${new Date().toISOString().split('T')[0]}\n`);
  
  if (!narrativesOnly) {
    if (!skipSocial) {
      try { await runSocialScan(); } catch (e) { console.error('Social scan failed:', e.message); }
      console.log('');
    }
    
    if (!skipGithub) {
      try { await runGithubScan(); } catch (e) { console.error('GitHub scan failed:', e.message); }
      console.log('');
    }
    
    if (!skipOnchain) {
      try { await runOnchainScan(); } catch (e) { console.error('Onchain scan failed:', e.message); }
      console.log('');
    }
  }
  
  // Generate narratives from collected signals
  try {
    await generateNarratives();
  } catch (e) {
    console.error('Narrative generation failed:', e.message);
  }
  
  console.log('\n✅ Full scan complete!');
}

main().catch(console.error);
