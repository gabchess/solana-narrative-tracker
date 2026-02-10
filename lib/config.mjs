// Shared config for Solana Narrative Tracker

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btkkaayncmmkouhsaxcr.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
export const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || '';

// Solana KOLs and project accounts to track
export const TRACKED_HANDLES = [
  // Core thought leaders
  '0xMert_',          // Mert Mumtaz - Helius CEO
  'aeyakovenko',      // Anatoly Yakovenko (Toly)
  'rajgokal',         // Raj Gokal - Solana co-founder
  'armaniferrante',   // Armani - Anchor/Backpack
  'buffalu__',        // buffalu - Jito founder
  'VibhuNorby',       // Vibhu - DRiP
  // Major projects
  'JupiterExchange',
  'jaboronkov',
  'jito_sol',
  'MarinadeFinance',
  'TensorFdn',
  'DriftProtocol',
  'PhoenixTrade',
  'KaminoFinance',
  'SanctumSo',
  'HeliusLabs',
  'MagicEden',
  // Ecosystem
  'SolanaFndn',
  'solana',
  'SolanaFloor',
  'SuperteamDAO',
];

// Solana-specific keyword matching
export const SOLANA_KEYWORDS = /launch|ship|new|feature|update|upgrade|v[234]|tvl|milestone|partnership|integration|governance|proposal|token|airdrop|reward|liquidity|pool|migrate|validator|stake|compressed|cnft|blink|action|firedancer|frankendancer|svm|rollup|appchain|depin|helium|hivemapper|render|pyth|wormhole|program|spl|mev|jito|tip|bundle|restaking|cambrian|solayer|sanctum|lst|jupiter|perp|dex|amm|clob|orderbook|drift|marginfi|kamino|meteora|raydium|orca|tensor|backpack|phantom|mobile|saga|seeker|gameshift|agent|\bai\b/i;

export const CATEGORIES = {
  defi: /defi|dex|amm|lending|borrow|yield|tvl|liquidity|pool|swap|perp|margin|vault|stake|lst|restaking/i,
  infra: /validator|rpc|svm|firedancer|frankendancer|rollup|appchain|bridge|oracle|indexer|data|api|sdk/i,
  consumer: /wallet|phantom|solflare|mobile|saga|blink|action|payment|nft|cnft|compressed|marketplace/i,
  depin: /depin|helium|hivemapper|render|iot|sensor|wireless|compute|storage/i,
  gaming: /gaming|game|gameshift|star.atlas|genopets|aurory|stepn|play/i,
  ai: /\bai\b|agent|llm|machine.learning|gpt|neural|model|inference/i,
};

export function categorize(text) {
  for (const [cat, regex] of Object.entries(CATEGORIES)) {
    if (regex.test(text)) return cat;
  }
  return 'other';
}

export function getMatchedKeywords(text) {
  const words = ['launch','ship','update','upgrade','tvl','milestone','partnership',
    'integration','governance','token','airdrop','reward','liquidity','migrate',
    'validator','stake','compressed','blink','firedancer','svm','rollup','depin',
    'mev','jito','restaking','lst','perp','dex','amm','nft','mobile','agent','ai',
    'oracle','bridge','wallet','program'];
  return words.filter(w => text.toLowerCase().includes(w));
}

// Supabase helpers
export async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return res.json();
}

export async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`POST ${table} failed:`, err);
    return null;
  }
  return res.json();
}
