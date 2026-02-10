'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://btkkaayncmmkouhsaxcr.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON || 'sb_publishable_o7PXOcKQ4PdOtFL5wAhVqw_bdrD3hWy';

async function fetchSupabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Supabase request failed (${res.status}): ${payload.substring(0, 180)}`);
  }
  return res.json();
}

const categoryColors = {
  defi: { bg: '#14F19533', border: '#14F195', text: '#14F195' },
  infra: { bg: '#9945FF33', border: '#9945FF', text: '#9945FF' },
  consumer: { bg: '#00D2FF33', border: '#00D2FF', text: '#00D2FF' },
  depin: { bg: '#FB923C33', border: '#FB923C', text: '#FB923C' },
  gaming: { bg: '#F43F5E33', border: '#F43F5E', text: '#F43F5E' },
  ai: { bg: '#A78BFA33', border: '#A78BFA', text: '#A78BFA' },
  other: { bg: '#6B728033', border: '#6B7280', text: '#6B7280' },
};

const statusIcons = {
  detected: '🔍',
  accelerating: '🚀',
  established: '📈',
  peaked: '📈',
  fading: '📉',
};

const difficultyColors = {
  easy: '#14F195',
  medium: '#FFD700',
  hard: '#F43F5E',
};

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 160,
    }}>
      <div style={{ fontSize: 13, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function NarrativeCard({ narrative }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryColors[narrative.category] || categoryColors.other;
  const toggle = () => setExpanded(!expanded);
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${cat.border}33`,
      borderRadius: 16,
      padding: 28,
      marginBottom: 20,
      transition: 'all 0.2s',
      cursor: 'pointer',
    }} onClick={toggle} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()} role="button" tabIndex={0} aria-expanded={expanded} aria-label={`Toggle build ideas for ${narrative.narrative_name}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{statusIcons[narrative.status] || '🔍'}</span>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#fff' }}>{narrative.narrative_name}</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              background: cat.bg,
              color: cat.text,
              border: `1px solid ${cat.border}66`,
              borderRadius: 20,
              padding: '2px 12px',
              fontSize: 12,
              fontWeight: 500,
            }}>{narrative.category}</span>
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#9CA3AF',
              borderRadius: 20,
              padding: '2px 12px',
              fontSize: 12,
            }}>{narrative.signal_count} signals</span>
          </div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${cat.border}44, ${cat.border}11)`,
          borderRadius: 12,
          padding: '8px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Confidence</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: cat.text }}>{Math.round((narrative.confidence || 0) * 100)}%</div>
        </div>
      </div>
      
      <p style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.6, margin: '12px 0' }}>
        {narrative.description}
      </p>
      
      {expanded && narrative.build_ideas?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ color: '#9CA3AF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            💡 Build Ideas
          </h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {narrative.build_ideas.map((idea, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{idea.title}</span>
                  <span style={{
                    color: difficultyColors[idea.difficulty] || '#9CA3AF',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                  }}>{idea.difficulty}</span>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: '4px 0', lineHeight: 1.5 }}>{idea.description}</p>
                <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0', fontStyle: 'italic' }}>{idea.narrative_fit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!expanded && narrative.build_ideas?.length > 0 && (
        <div style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
          Click to see {narrative.build_ideas.length} build ideas →
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [report, setReport] = useState(null);
  const [narratives, setNarratives] = useState([]);
  const [stats, setStats] = useState({ social: 0, github: 0, onchain: 0 });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reps, narrs, socialCount, githubCount, onchainCount] = await Promise.all([
        fetchSupabase('reports?order=created_at.desc&limit=1'),
        fetchSupabase('narratives?order=confidence.desc&limit=20'),
        fetchSupabase('social_signals?select=id&limit=1000'),
        fetchSupabase('github_signals?select=id&limit=1000'),
        fetchSupabase('onchain_signals?select=id&limit=1000'),
      ]);
      
      setReport(reps?.[0] || null);
      setNarratives(Array.isArray(narrs) ? narrs : []);
      setStats({
        social: socialCount?.length || 0,
        github: githubCount?.length || 0,
        onchain: onchainCount?.length || 0,
      });
    } catch (e) {
      console.error('Load error:', e);
      setError(e.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalSignals = stats.social + stats.github + stats.onchain;
  const filteredNarratives = useMemo(
    () => (categoryFilter === 'all' ? narratives : narratives.filter(n => n.category === categoryFilter)),
    [categoryFilter, narratives],
  );
  const visibleNarratives = useMemo(() => {
    const list = [...filteredNarratives];
    list.sort((a, b) => {
      if (sortBy === 'signals') return (b.signal_count || 0) - (a.signal_count || 0);
      return (b.confidence || 0) - (a.confidence || 0);
    });
    return list;
  }, [filteredNarratives, sortBy]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      color: '#fff',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(153,69,255,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 0 32px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🔭</span>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, background: 'linear-gradient(135deg, #9945FF, #14F195)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Solana Narrative Tracker
            </h1>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0, maxWidth: 600 }}>
            AI-powered detection of emerging narratives and early signals in the Solana ecosystem. Refreshed fortnightly.
          </p>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={load}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#E5E7EB',
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Refresh live data
            </button>
          </div>
          
          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            <StatCard label="Narratives" value={narratives.length} sub="detected this period" />
            <StatCard label="Total Signals" value={totalSignals} sub={`${stats.social} social / ${stats.github} github / ${stats.onchain} onchain`} />
            <StatCard label="Period" value="14d" sub={report ? `${report.period_start} → ${report.period_end}` : 'Current fortnight'} />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#FCA5A5' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ marginBottom: 12 }}>Failed to load live data from Supabase.</div>
            <button
              onClick={load}
              style={{
                background: 'rgba(252,165,165,0.1)',
                border: '1px solid rgba(252,165,165,0.4)',
                color: '#FCA5A5',
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading signals...
          </div>
        ) : narratives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            No narratives detected yet. Run the scanner to collect signals.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                <option value="all">All categories</option>
                {Object.keys(categoryColors).filter(c => c !== 'other').map(c => <option key={c} value={c}>{c}</option>)}
                <option value="other">other</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                <option value="confidence">Sort: Confidence</option>
                <option value="signals">Sort: Signal Count</option>
              </select>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#D1D5DB', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📌</span> Detected Narratives ({visibleNarratives.length})
            </h2>
            {visibleNarratives.map((n, i) => (
              <NarrativeCard key={n.id || i} narrative={n} />
            ))}
          </>
        )}
        
        {/* Methodology */}
        <div style={{
          marginTop: 48,
          padding: 28,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
        }}>
          <h3 style={{ color: '#9CA3AF', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 0 }}>
            📋 Methodology
          </h3>
          <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.8 }}>
            <p><strong style={{ color: '#9CA3AF' }}>Data Sources:</strong> X/Twitter (20+ KOLs & projects), GitHub (tracked repos + trending search), DeFi Llama (TVL & protocol metrics)</p>
            <p><strong style={{ color: '#9CA3AF' }}>Signal Detection:</strong> Keyword matching + engagement weighting for social; star/fork/commit velocity for GitHub; TVL delta % for onchain</p>
            <p><strong style={{ color: '#9CA3AF' }}>Narrative Clustering:</strong> AI-powered analysis groups signals into coherent narratives, scores confidence, and generates actionable build ideas</p>
            <p><strong style={{ color: '#9CA3AF' }}>Refresh Cadence:</strong> Fortnightly, with continuous signal collection</p>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '40px 0 20px', color: '#4B5563', fontSize: 12 }}>
          Built by{' '}
          <a href="https://x.com/gabe_onchain" style={{ color: '#9945FF', textDecoration: 'none' }}>@gabe_onchain</a>
          {' '}& AI Agent{' '}
          <a href="https://x.com/AriaLinkwell" style={{ color: '#14F195', textDecoration: 'none' }}>@AriaLinkwell</a>
          {' '}| Powered by Supabase + Solana
        </div>
      </div>
    </div>
  );
}
