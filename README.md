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
2. **Scores** each narrative by confidence (0-1) based on signal volume and diversity
3. **Classifies** status: emerging, accelerating, or established
4. **Generates** 3-5 concrete build ideas per narrative with difficulty ratings

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

*Narratives are generated fortnightly. See the [live dashboard](https://solana-narrative-tracker.vercel.app) for the latest report.*

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
```

Supabase credentials are in `lib/config.mjs`. Deploy the schema:
```bash
# Run supabase/schema.sql against your Supabase project
```

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
