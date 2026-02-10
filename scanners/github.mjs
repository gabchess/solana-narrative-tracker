#!/usr/bin/env node
// GitHub Signal Scanner — tracks Solana ecosystem repo activity
// Uses GitHub Search API (no auth needed for basic searches)

import { supabasePost } from '../lib/config.mjs';

const GITHUB_API = 'https://api.github.com';

// Key Solana repos to track directly
const TRACKED_REPOS = [
  'solana-labs/solana',
  'anza-xyz/agave',
  'firedancer-io/firedancer',
  'solana-foundation/solana-improvement-documents',
  'coral-xyz/anchor',
  'jito-foundation/jito-solana',
  'drift-labs/protocol-v2',
  'kamino-finance/kliquidity',
  'project-serum/serum-dex',
  'metaplex-foundation/mpl-core',
  'jupiter-project/jupiter-core',
  'marinade-finance/liquid-staking-program',
  'sanctumfi/sanctum-solana-program',
  'helium/helium-program-library',
  'hivemapper/hivemapper-data-logger',
  'tensor-foundation/marketplace',
  'magiceden-oss/open_creator_protocol',
  'squadsprotocol/v4',
  'switchboardxyz/switchboard',
  'pyth-network/pyth-sdk-solana',
];

async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'solana-narrative-tracker',
    }
  });
  if (!res.ok) {
    if (res.status === 403) {
      console.warn('GitHub rate limit hit, waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      return githubFetch(path);
    }
    console.error(`GitHub ${path}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function getRepoInfo(fullName) {
  return githubFetch(`/repos/${fullName}`);
}

async function getRecentCommits(fullName, since) {
  const data = await githubFetch(`/repos/${fullName}/commits?since=${since}&per_page=1`);
  // GitHub returns commits array; just need count
  if (!data) return 0;
  // For count, we'd need pagination. Rough estimate from first page
  return Array.isArray(data) ? data.length : 0;
}

async function searchTrendingSolanaRepos() {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const query = encodeURIComponent(`solana created:>${twoWeeksAgo} stars:>5`);
  const data = await githubFetch(`/search/repositories?q=${query}&sort=stars&order=desc&per_page=20`);
  return data?.items || [];
}

async function searchActiveRepos() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const query = encodeURIComponent(`solana pushed:>${oneWeekAgo} stars:>50`);
  const data = await githubFetch(`/search/repositories?q=${query}&sort=updated&order=desc&per_page=30`);
  return data?.items || [];
}

export async function runGithubScan() {
  console.log('🐙 Starting GitHub Signal Scanner...\n');
  
  let totalSignals = 0;
  const allSignals = [];
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  
  // 1. Scan tracked repos
  console.log('Scanning tracked repos...');
  for (const repoName of TRACKED_REPOS) {
    const repo = await getRepoInfo(repoName);
    if (!repo) continue;
    
    const signal = {
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      stars: repo.stargazers_count,
      stars_delta: 0, // would need historical data
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      recent_commits: 0,
      language: repo.language,
      description: repo.description?.substring(0, 500),
      topics: repo.topics || [],
      last_push_at: repo.pushed_at,
      signal_type: 'tracked',
    };
    
    allSignals.push(signal);
    const result = await supabasePost('github_signals', signal);
    if (result) totalSignals++;
    
    await new Promise(r => setTimeout(r, 1000)); // rate limit
  }
  
  // 2. Find new trending Solana repos
  console.log('\nSearching for new trending Solana repos...');
  const trending = await searchTrendingSolanaRepos();
  for (const repo of trending) {
    const signal = {
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      language: repo.language,
      description: repo.description?.substring(0, 500),
      topics: repo.topics || [],
      last_push_at: repo.pushed_at,
      signal_type: 'new_repo',
    };
    allSignals.push(signal);
    await supabasePost('github_signals', signal);
    totalSignals++;
  }
  
  // 3. Find most active Solana repos
  console.log('Searching for most active Solana repos...');
  const active = await searchActiveRepos();
  for (const repo of active) {
    // Skip if already tracked
    if (allSignals.some(s => s.repo_full_name === repo.full_name)) continue;
    
    const signal = {
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      language: repo.language,
      description: repo.description?.substring(0, 500),
      topics: repo.topics || [],
      last_push_at: repo.pushed_at,
      signal_type: 'activity_spike',
    };
    allSignals.push(signal);
    await supabasePost('github_signals', signal);
    totalSignals++;
  }
  
  console.log(`\n🐙 GitHub scan complete: ${totalSignals} signals stored`);
  return allSignals;
}

if (process.argv[1]?.endsWith('github.mjs')) {
  runGithubScan().catch(console.error);
}
