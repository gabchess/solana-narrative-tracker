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

export function assertSupabaseConfig({ requireServiceKey = true } = {}) {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL is missing.');
  if (requireServiceKey && !SUPABASE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY is missing. Set it before running scanners.');
  }
}

function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  let attempt = 0;
  while (true) {
    attempt++;
    const timeout = withTimeout(15000);
    try {
      const res = await fetch(url, { ...options, signal: timeout.signal });
      timeout.clear();
      if (res.ok) return res;
      if (attempt > retries || ![429, 500, 502, 503, 504].includes(res.status)) return res;
      await new Promise(r => setTimeout(r, 400 * attempt));
    } catch (e) {
      timeout.clear();
      if (attempt > retries) throw e;
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
}

async function supabaseRequest(path, init = {}, { service = true } = {}) {
  const key = service ? SUPABASE_KEY : SUPABASE_ANON;
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL is missing.');
  if (!key) {
    throw new Error(service ? 'SUPABASE_SERVICE_KEY is missing.' : 'SUPABASE_ANON_KEY is missing.');
  }
  const res = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Supabase ${init.method || 'GET'} ${path} failed (${res.status}): ${payload.substring(0, 300)}`);
  }
  return res.json();
}

// Supabase helpers
export async function supabaseGet(path, options = {}) {
  return supabaseRequest(path, {}, options);
}

export async function supabasePost(table, data, options = {}) {
  try {
    return await supabaseRequest(table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(data),
    }, options);
  } catch (e) {
    console.error(`POST ${table} failed:`, e.message);
    return null;
  }
}

export { fetchWithRetry };
