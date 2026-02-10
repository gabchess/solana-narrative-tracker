# 🔭 Solana Narrative Tracker

**AI-powered tool that detects emerging narratives and early signals within the Solana ecosystem, refreshed fortnightly.**

Built by [@gabe_onchain](https://x.com/gabe_onchain) & AI Agent [@AriaLinkwell](https://x.com/AriaLinkwell)

🔗 **Live Dashboard:** [solana-narrative-tracker.vercel.app](https://solana-narrative-tracker.vercel.app)

---

## How It Works

The Solana Narrative Tracker monitors three categories of ecosystem signals, clusters them into coherent narratives using AI, and generates actionable build ideas tied to each narrative.

### Data Sources

| Source | What We Track | Method |
|--------|--------------|--------|
| **X/Twitter** | 20+ Solana KOLs & major projects (Mert, Toly, Jupiter, Jito, Drift, etc.) | Bird CLI → keyword matching + engagement weighting |
| **GitHub** | 20+ tracked Solana repos + trending search for new repos | GitHub Search API → star/fork/commit velocity |
| **DeFi Llama** | TVL for 25+ Solana protocols + chain-level metrics | DeFi Llama API → 14-day delta % tracking |

### Signal Detection & Ranking

**Social signals** are scored by:
- Keyword relevance (Solana-specific taxonomy: DeFi, infra, consumer, DePIN, gaming, AI)
- Engagement weighting: `likes + (retweets × 2) + (replies × 1.5)`, normalized to 0-1
- Source authority (core team > project accounts > ecosystem media)

**GitHub signals** are classified as:
- `tracked`: Core Solana repos monitored continuously
- `new_repo`: Repos created in last 14 days with >5 stars
- `activity_spike`: Repos with unusual commit/star velocity

**Onchain signals** track:
- Protocol TVL changes (14-day delta)
- Chain-level TVL trends
- Top movers by 7-day growth %

### Narrative Clustering

After signal collection, an AI model (Claude Sonnet / Gemini Flash) analyzes all signals and:

1. **Groups** related signals into 4-7 coherent narratives
2. **Scores** each narrative by confidence (0-1), clamped to `[0,1]` before storage
3. **Classifies** status: detected, accelerating, peaked, or fading
4. **Generates** 3-5 concrete build ideas per narrative with difficulty ratings

### Confidence Interpretation

- `0.00 - 0.39`: weak narrative signal, often sparse or single-source
- `0.40 - 0.69`: moderate narrative signal, cross-source hints present
- `0.70 - 1.00`: strong narrative signal, repeated evidence across social/GitHub/onchain

### Architecture

```
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐
│  Social Scanner  │   │  GitHub Scanner   │   │ Onchain Scanner │
│  (Bird CLI / X)  │   │  (GitHub API)     │   │ (DeFi Llama)    │
└────────┬────────┘   └────────┬──────────┘   └────────┬────────┘
         │                     │                       │
         └──────────┬──────────┴───────────────────────┘
                    │
            ┌───────▼────────┐
            │    Supabase    │
            │  (PostgreSQL)  │
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │   AI Narrative │
            │     Engine     │
            │ (Claude/Gemini)│
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │   Next.js      │
            │   Dashboard    │
            │   (Vercel)     │
            └────────────────┘
```

## Detected Narratives

Narratives are generated fortnightly. The dashboard loads the latest report and narratives from Supabase at runtime.

Example output format:

```json
{
  "narrative_name": "Solana Restaking and LST Competition",
  "confidence": 0.82,
  "status": "accelerating",
  "category": "defi",
  "signal_count": 18,
  "supporting_signals": [
    "Jito and Sanctum engagement spike",
    "TVL moved into staking-related protocols"
  ],
  "build_ideas": [
    {
      "title": "LST Yield Rotation Router",
      "difficulty": "medium",
      "narrative_fit": "Captures user demand for active stake management."
    }
  ]
}
```

See the latest live report: [solana-narrative-tracker.vercel.app](https://solana-narrative-tracker.vercel.app).

## Build Ideas

Each detected narrative includes 3-5 concrete product ideas that founders could build. Ideas include:
- **Title** and clear description
- **Difficulty** rating (easy / medium / hard)
- **Narrative fit** explaining how the idea connects to the emerging trend

## Setup & Reproduce

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Bird CLI (`npm i -g @steipete/bird`) with X auth
- Anthropic or OpenRouter API key

### Install

```bash
git clone https://github.com/gabchess/solana-narrative-tracker
cd solana-narrative-tracker
npm install
```

### Configure

Set environment variables:
```bash
export ANTHROPIC_API_KEY=sk-ant-...    # For narrative engine
# OR
export OPENROUTER_API_KEY=sk-or-...    # Alternative

# Supabase (required for scanners + dashboard)
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_KEY=eyJ...      # service role key (server-side scanner only)
export SUPABASE_ANON_KEY=eyJ...         # publishable/anon key (dashboard reads)

# Bird auth for social scanner
export AUTH_TOKEN=...
export CT0=...

# Next.js public envs for client dashboard
export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

Deploy the schema:
```bash
# Run supabase/schema.sql against your Supabase project
```

If you use local development env files, create `.env.local` with the same keys.

### Run

```bash
# Full scan (social + github + onchain + narrative generation)
node scan.mjs

# Individual scanners
node scanners/social.mjs
node scanners/github.mjs
node scanners/onchain.mjs

# Narrative generation only (uses existing signals)
node scan.mjs --narratives-only

# Skip specific scanners
node scan.mjs --skip-social --skip-github
```

### Dashboard

```bash
npx next dev       # Local development
npx next build     # Production build
```

Deploy to Vercel:
```bash
vercel --prod
```

## Quick Demo (For Judges)

1. Run ingestion + narrative generation:
```bash
npm run scan
```
2. Confirm rows exist in Supabase tables: `social_signals`, `github_signals`, `onchain_signals`, `narratives`, `reports`.
3. Start dashboard:
```bash
npm run dev
```
4. Open `http://localhost:3000` and verify:
   - latest report period is shown
   - narrative cards show confidence scores
   - build ideas expand on click
   - refresh button re-fetches live Supabase data

## Evaluation Method

- **Coverage metric:** number of signals gathered per source each period.
- **Narrative strength metric:** confidence score with source diversity and signal density.
- **Actionability metric:** each narrative must include 3-5 concrete build ideas.
- **Human spot-check:** top narratives reviewed for coherence and usefulness.

## Current Limitations

- Social scanner depends on Bird CLI session/auth (`AUTH_TOKEN`, `CT0`).
- Free/public APIs can rate-limit and delay runs.
- LLM narrative quality varies by model/provider and prompt adherence.
- Signal taxonomy is keyword-driven and may miss novel phrasing.
- Dashboard currently prioritizes latest data read over historical drill-down UX.

## Live Data Strategy

- Current deployment uses static export for hosting simplicity.
- The page still fetches live Supabase data on load and supports manual refresh + retry.
- If SEO or first-load hydration becomes a priority, remove `output: 'export'` and switch to server-rendered data fetch in Next.js.

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Database:** Supabase (PostgreSQL)
- **Social Data:** Bird CLI (X/Twitter GraphQL)
- **GitHub Data:** GitHub REST API
- **Onchain Data:** DeFi Llama API
- **AI:** Anthropic Claude / Google Gemini (via OpenRouter)
- **Frontend:** Next.js 15 + React 19
- **Hosting:** Vercel

## License

MIT
