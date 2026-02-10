#!/usr/bin/env node
// Onchain Signal Scanner — tracks Solana ecosystem onchain metrics
// Sources: DeFi Llama (free, no auth), Solana public RPC

import { supabasePost, assertSupabaseConfig, fetchWithRetry } from '../lib/config.mjs';

const DEFILLAMA_API = 'https://api.llama.fi';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

// Key Solana protocols to track TVL
const SOLANA_PROTOCOLS = [
  'jito', 'marinade-finance', 'jupiter', 'raydium', 'orca',
  'drift-protocol', 'kamino', 'solend', 'marginfi', 'sanctum',
  'meteora', 'phoenix', 'tensor', 'magic-eden', 'helium',
  'hivemapper', 'render-network', 'pyth-network', 'parcl',
  'flash-trade', 'lifinity', 'tulip-protocol', 'francium',
  'hubble', 'port-finance', 'larix', 'apricot-finance',
];

async function fetchJSON(url) {
  try {
    const res = await fetchWithRetry(url, {}, 2);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error(`Fetch error ${url}:`, e.message);
    return null;
  }
}

async function getSolanaTVL() {
  // Overall Solana chain TVL
  const data = await fetchJSON(`${DEFILLAMA_API}/v2/historicalChainTvl/Solana`);
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  
  const latest = data[data.length - 1];
  const twoWeeksAgo = data.length >= 15 ? data[data.length - 15] : (data[0] || latest);
  
  if (latest && twoWeeksAgo && twoWeeksAgo.tvl > 0) {
    const delta = ((latest.tvl - twoWeeksAgo.tvl) / twoWeeksAgo.tvl * 100);
    return {
      current: latest.tvl,
      previous: twoWeeksAgo.tvl,
      deltaPercent: delta,
      date: new Date(latest.date * 1000).toISOString(),
    };
  }
  return null;
}

async function getProtocolTVL(slug) {
  const data = await fetchJSON(`${DEFILLAMA_API}/protocol/${slug}`);
  if (!data) return null;
  
  let currentTvl = data.currentChainTvls?.Solana ?? data.tvl ?? 0;
  if (typeof currentTvl !== 'number') currentTvl = parseFloat(currentTvl) || 0;
  
  // Get TVL change
  let tvl14dAgo = currentTvl;
  if (data.chainTvls?.Solana?.tvl && Array.isArray(data.chainTvls.Solana.tvl)) {
    const tvlHistory = data.chainTvls.Solana.tvl;
    const twoWeeksEntry = tvlHistory[tvlHistory.length - 15];
    if (twoWeeksEntry) tvl14dAgo = twoWeeksEntry.totalLiquidityUSD || 0;
  }
  
  const deltaPercent = tvl14dAgo > 0 ? ((currentTvl - tvl14dAgo) / tvl14dAgo * 100) : 0;
  
  return {
    name: data.name,
    slug: data.slug,
    tvl: currentTvl,
    tvlDelta: deltaPercent,
    category: data.category,
    chains: data.chains,
    url: data.url,
  };
}

async function getSolanaStats() {
  // Use Solana RPC for basic stats
  try {
    const [supplyRes, perfRes] = await Promise.all([
      fetchJSON(SOLANA_RPC).catch(() => null), // would need POST
      fetchJSON('https://api.solscan.io/chaininfo').catch(() => null),
    ]);
    return null; // fallback - use DeFi Llama data primarily
  } catch {
    return null;
  }
}

export async function runOnchainScan() {
  console.log('⛓️  Starting Onchain Signal Scanner...\n');
  assertSupabaseConfig();
  
  let totalSignals = 0;
  const allSignals = [];
  
  // 1. Solana overall TVL
  console.log('Fetching Solana chain TVL...');
  const solanaTvl = await getSolanaTVL();
  if (solanaTvl) {
    const signal = {
      signal_type: 'tvl_change',
      program_name: 'Solana (chain)',
      metric_name: 'total_tvl',
      metric_value: solanaTvl.current,
      metric_delta: solanaTvl.deltaPercent,
      source: 'defillama',
      metadata: { current: solanaTvl.current, previous: solanaTvl.previous, deltaPercent: solanaTvl.deltaPercent },
    };
    allSignals.push(signal);
    const result = await supabasePost('onchain_signals', signal);
    if (result) totalSignals++;
    console.log(`  Solana TVL: $${(solanaTvl.current/1e9).toFixed(2)}B (${solanaTvl.deltaPercent > 0 ? '+' : ''}${solanaTvl.deltaPercent.toFixed(1)}% 14d)`);
  }
  
  // 2. Protocol-level TVL
  console.log('\nFetching protocol TVLs...');
  const protocolData = [];
  
  for (const slug of SOLANA_PROTOCOLS) {
    const proto = await getProtocolTVL(slug);
    if (!proto || proto.tvl < 100000) continue; // skip tiny protocols
    
    const signal = {
      signal_type: 'tvl_change',
      program_name: proto.name,
      metric_name: 'protocol_tvl',
      metric_value: proto.tvl,
      metric_delta: proto.tvlDelta,
      source: 'defillama',
      metadata: { slug: proto.slug, category: proto.category, url: proto.url },
    };
    
    allSignals.push(signal);
    const result = await supabasePost('onchain_signals', signal);
    if (result) totalSignals++;
    protocolData.push(proto);
    
    // Be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Highlight movers (>20% change)
  const bigMovers = protocolData.filter(p => Math.abs(p.tvlDelta) > 20);
  if (bigMovers.length) {
    console.log('\n📈 Big movers (>20% TVL change in 14d):');
    for (const p of bigMovers.sort((a, b) => b.tvlDelta - a.tvlDelta)) {
      console.log(`  ${p.name}: $${(p.tvl/1e6).toFixed(1)}M (${p.tvlDelta > 0 ? '+' : ''}${p.tvlDelta.toFixed(1)}%)`);
    }
  }
  
  // 3. Fetch trending Solana protocols from DeFi Llama
  console.log('\nFetching protocol rankings...');
  const allProtocols = await fetchJSON(`${DEFILLAMA_API}/protocols`);
  if (allProtocols) {
    const solanaProtocols = allProtocols
      .filter(p => p.chains?.includes('Solana'))
      .sort((a, b) => (b.change_7d || 0) - (a.change_7d || 0))
      .slice(0, 10);
    
    for (const p of solanaProtocols) {
      if (protocolData.some(pd => pd.slug === p.slug)) continue;
      
      const signal = {
        signal_type: 'tvl_change',
        program_name: p.name,
        metric_name: 'tvl_7d_growth',
        metric_value: p.tvl || 0,
        metric_delta: p.change_7d || 0,
        source: 'defillama',
        metadata: { slug: p.slug, category: p.category, change_1d: p.change_1d, change_7d: p.change_7d },
      };
      allSignals.push(signal);
      const result = await supabasePost('onchain_signals', signal);
      if (result) totalSignals++;
    }
  }
  
  console.log(`\n⛓️  Onchain scan complete: ${totalSignals} signals stored`);
  return allSignals;
}

if (process.argv[1]?.endsWith('onchain.mjs')) {
  runOnchainScan().catch(console.error);
}
