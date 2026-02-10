#!/usr/bin/env node
// Social Signal Scanner — scans Solana KOLs and projects on X
// Uses Bird CLI for tweet fetching

import { execSync } from 'child_process';
import { TRACKED_HANDLES, SOLANA_KEYWORDS, categorize, getMatchedKeywords, supabasePost, assertSupabaseConfig } from '../lib/config.mjs';

function parseBirdOutput(output) {
  const tweets = [];
  const blocks = output.split(/─{10,}/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    
    const urlLine = lines.find(l => l.includes('https://x.com/'));
    if (!urlLine) continue;
    
    const urlMatch = urlLine.match(/https:\/\/x\.com\/(\w+)\/status\/(\d+)/);
    if (!urlMatch) continue;
    
    const handle = urlMatch[1];
    const tweetId = urlMatch[2];
    const tweetUrl = urlMatch[0];
    
    const dateLine = lines.find(l => l.startsWith('📅 '));
    const postedAt = dateLine ? new Date(dateLine.replace('📅 ', '')).toISOString() : new Date().toISOString();
    
    // Only last 14 days
    const tweetDate = new Date(postedAt);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    if (tweetDate < fourteenDaysAgo) continue;
    
    // Extract text
    const accountLineIdx = lines.findIndex(l => l.startsWith('@'));
    const dateLineIdx = lines.findIndex(l => l.startsWith('📅'));
    
    let tweetText = '';
    if (accountLineIdx >= 0 && dateLineIdx > accountLineIdx) {
      tweetText = lines.slice(accountLineIdx + 1, dateLineIdx)
        .filter(l => !l.startsWith('🖼️') && !l.startsWith('🔗') && !l.startsWith('❤️') && !l.startsWith('┌') && !l.startsWith('│') && !l.startsWith('└'))
        .join(' ').trim();
    }
    
    // Include quoted tweet text
    const qtLines = lines.filter(l => l.startsWith('│ '));
    if (qtLines.length) {
      tweetText += ' ' + qtLines.map(l => l.replace('│ ', '')).join(' ');
    }
    
    if (!tweetText) {
      tweetText = lines.slice(1).filter(l => 
        !l.startsWith('📅') && !l.startsWith('🔗') && !l.startsWith('🖼️') && 
        !l.startsWith('❤️') && !l.startsWith('🎬') && !l.startsWith('┌') && 
        !l.startsWith('│') && !l.startsWith('└')
      ).join(' ').trim();
    }
    
    // Extract engagement
    const engLine = lines.find(l => l.startsWith('❤️'));
    const engagement = {};
    if (engLine) {
      const likeMatch = engLine.match(/❤️\s*(\d+)/);
      const rtMatch = engLine.match(/🔁\s*(\d+)/);
      const replyMatch = engLine.match(/💬\s*(\d+)/);
      if (likeMatch) engagement.likes = parseInt(likeMatch[1]);
      if (rtMatch) engagement.retweets = parseInt(rtMatch[1]);
      if (replyMatch) engagement.replies = parseInt(replyMatch[1]);
    }
    
    tweets.push({ handle, tweetId, tweetText, tweetUrl, postedAt, engagement });
  }
  
  return tweets;
}

async function scanHandle(handle) {
  try {
    const cmd = process.platform === 'win32'
      ? `powershell -Command "$env:AUTH_TOKEN = [System.Environment]::GetEnvironmentVariable('AUTH_TOKEN','User'); $env:CT0 = [System.Environment]::GetEnvironmentVariable('CT0','User'); bird search 'from:${handle}' --count 10 2>&1"`
      : `bird search "from:${handle}" --count 10 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', timeout: 45000 });
    return parseBirdOutput(output);
  } catch (e) {
    console.error(`Error scanning @${handle}:`, e.message?.substring(0, 100));
    return [];
  }
}

export async function runSocialScan() {
  console.log('🐦 Starting Social Signal Scanner...');
  console.log(`Tracking ${TRACKED_HANDLES.length} handles\n`);
  assertSupabaseConfig();
  if (!process.env.AUTH_TOKEN || !process.env.CT0) {
    console.warn('AUTH_TOKEN/CT0 are not set in this shell. Bird may fail if not already authenticated.');
  }
  
  let totalSignals = 0;
  const allSignals = [];
  
  for (const handle of TRACKED_HANDLES) {
    console.log(`Scanning @${handle}...`);
    const tweets = await scanHandle(handle);
    
    for (const tweet of tweets) {
      if (!SOLANA_KEYWORDS.test(tweet.tweetText)) continue;
      
      const keywords = getMatchedKeywords(tweet.tweetText);
      const category = categorize(tweet.tweetText);
      const totalEng = (tweet.engagement.likes || 0) + (tweet.engagement.retweets || 0) * 2 + (tweet.engagement.replies || 0) * 1.5;
      const signalStrength = Math.min(1, totalEng / 5000); // normalize
      
      const signal = {
        source: 'x_kol',
        handle: tweet.handle || handle,
        tweet_id: tweet.tweetId,
        tweet_text: tweet.tweetText.substring(0, 2000),
        tweet_url: tweet.tweetUrl,
        posted_at: tweet.postedAt,
        engagement: tweet.engagement,
        keywords_matched: keywords,
        category,
        signal_strength: signalStrength,
      };
      
      allSignals.push(signal);
      
      const result = await supabasePost('social_signals', signal);
      if (result) totalSignals++;
    }
    
    // Rate limit: wait 2s between handles
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n🐦 Social scan complete: ${totalSignals} signals stored from ${TRACKED_HANDLES.length} handles`);
  return allSignals;
}

// Run directly
if (process.argv[1]?.endsWith('social.mjs')) {
  runSocialScan().catch(console.error);
}
