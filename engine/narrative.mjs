#!/usr/bin/env node
// Narrative Engine — AI-powered clustering of signals into narratives + build ideas
// Uses OpenRouter API for inference

import { supabaseGet, supabasePost, assertSupabaseConfig } from '../lib/config.mjs';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

async function callLLM(systemPrompt, userPrompt) {
  // Try Anthropic first, then OpenRouter
  if (ANTHROPIC_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }
  }
  
  if (OPENROUTER_KEY) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
  
  throw new Error('No API key available. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY');
}

function getPeriod() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
    label: `${start.toISOString().split('T')[0]}_${now.toISOString().split('T')[0]}`,
  };
}

async function fetchRecentSignals() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since = encodeURIComponent(fourteenDaysAgo);
  
  const [social, github, onchain] = await Promise.all([
    supabaseGet(`social_signals?created_at=gte.${since}&order=signal_strength.desc&limit=100`),
    supabaseGet(`github_signals?created_at=gte.${since}&order=stars.desc&limit=50`),
    supabaseGet(`onchain_signals?created_at=gte.${since}&order=created_at.desc&limit=50`),
  ]);
  
  return { social, github, onchain };
}

function normalizeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'accelerating') return 'accelerating';
  if (status === 'peaked' || status === 'fading') return status;
  return 'detected';
}

function buildSignalSummary(signals) {
  let summary = '## Social Signals (X/Twitter)\n';
  
  if (signals.social?.length) {
    for (const s of signals.social.slice(0, 50)) {
      summary += `- @${s.handle} [${s.category}]: ${s.tweet_text?.substring(0, 200)} (keywords: ${s.keywords_matched?.join(', ')})\n`;
    }
  } else {
    summary += '- No social signals collected yet\n';
  }
  
  summary += '\n## GitHub Activity\n';
  if (signals.github?.length) {
    for (const g of signals.github.slice(0, 30)) {
      summary += `- ${g.repo_full_name}: ${g.stars} stars, ${g.signal_type} — ${g.description?.substring(0, 150)}\n`;
    }
  } else {
    summary += '- No GitHub signals collected yet\n';
  }
  
  summary += '\n## Onchain Metrics\n';
  if (signals.onchain?.length) {
    for (const o of signals.onchain.slice(0, 30)) {
      const delta = o.metric_delta ? `(${o.metric_delta > 0 ? '+' : ''}${o.metric_delta.toFixed(1)}%)` : '';
      summary += `- ${o.program_name}: ${o.metric_name} = ${o.metric_value?.toLocaleString()} ${delta} [${o.source}]\n`;
    }
  } else {
    summary += '- No onchain signals collected yet\n';
  }
  
  return summary;
}

export async function generateNarratives() {
  console.log('🧠 Starting Narrative Engine...\n');
  assertSupabaseConfig();
  
  const period = getPeriod();
  const signals = await fetchRecentSignals();
  const signalSummary = buildSignalSummary(signals);
  const totalSignals = (signals.social?.length || 0) + (signals.github?.length || 0) + (signals.onchain?.length || 0);
  
  console.log(`Signals collected: ${signals.social?.length || 0} social, ${signals.github?.length || 0} github, ${signals.onchain?.length || 0} onchain`);
  
  if (totalSignals === 0) {
    console.log('⚠️ No signals found. Run scanners first.');
    return [];
  }
  
  const systemPrompt = `You are an expert Solana ecosystem analyst. Your job is to analyze raw signals (social media posts, GitHub activity, onchain metrics) and identify emerging narratives in the Solana ecosystem.

You must output valid JSON only, no markdown.`;

  const userPrompt = `Analyze these signals from the past 14 days (${period.start} to ${period.end}) and identify 4-7 emerging or accelerating narratives in the Solana ecosystem.

${signalSummary}

For each narrative, provide:
1. A clear name
2. A slug (kebab-case)
3. A 2-4 sentence description explaining what's happening and why it matters
4. Confidence score (0-1)
5. Status: "detected", "accelerating", "peaked", or "fading"
6. Category: "defi", "infra", "consumer", "depin", "gaming", "ai", or "other"
7. 3-5 concrete build ideas that founders could execute on this narrative. Each build idea needs: title, description (2-3 sentences), difficulty (easy/medium/hard), and how it fits the narrative.

Output as JSON array:
[{
  "name": "Narrative Name",
  "slug": "narrative-name",
  "description": "What is happening...",
  "confidence": 0.8,
  "status": "accelerating",
  "category": "defi",
  "signal_count": 12,
  "supporting_signals": ["brief signal reference 1", "brief signal reference 2"],
  "build_ideas": [
    {
      "title": "Build Idea Name",
      "description": "What to build and why...",
      "difficulty": "medium",
      "narrative_fit": "How this connects to the narrative"
    }
  ]
}]`;

  console.log('\nCalling LLM for narrative analysis...');
  const response = await callLLM(systemPrompt, userPrompt);
  
  // Parse JSON from response
  let narratives;
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      narratives = JSON.parse(jsonMatch[0]);
    } else {
      narratives = JSON.parse(response);
    }
  } catch (e) {
    console.error('Failed to parse LLM response:', e.message);
    console.error('Raw response:', response.substring(0, 500));
    return [];
  }
  
  // Store narratives
  console.log(`\n📊 Generated ${narratives.length} narratives:\n`);
  
  for (const n of narratives) {
    console.log(`  📌 ${n.name} (${n.status}, confidence: ${n.confidence})`);
    console.log(`     ${n.description.substring(0, 100)}...`);
    console.log(`     Build ideas: ${n.build_ideas?.map(b => b.title).join(', ')}\n`);
    
    await supabasePost('narratives', {
      report_period: period.label,
      narrative_name: n.name,
      narrative_slug: n.slug,
      description: n.description,
      confidence: normalizeConfidence(n.confidence),
      signal_count: n.signal_count || 0,
      category: n.category,
      supporting_signals: n.supporting_signals || [],
      build_ideas: n.build_ideas || [],
      status: normalizeStatus(n.status),
    });
  }
  
  // Create/update report
  const reportData = {
    period_start: period.start,
    period_end: period.end,
    title: `Solana Narrative Report: ${period.start} to ${period.end}`,
    summary: `${narratives.length} narratives detected from ${totalSignals} signals across social, GitHub, and onchain sources.`,
    narratives_count: narratives.length,
    total_signals: totalSignals,
    report_data: { narratives, signal_counts: { social: signals.social?.length || 0, github: signals.github?.length || 0, onchain: signals.onchain?.length || 0 } },
    published_at: new Date().toISOString(),
  };
  
  await supabasePost('reports', reportData);
  
  console.log(`\n🧠 Narrative generation complete. Report saved for ${period.label}`);
  return narratives;
}

if (process.argv[1]?.endsWith('narrative.mjs')) {
  generateNarratives().catch(console.error);
}
