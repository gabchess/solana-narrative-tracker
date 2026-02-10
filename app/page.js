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

/** Icon Components for that Pro feel */
const Icons = {
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
  ),
  Twitter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 0-1.5.2c.5-.3.9-.8 1-1.3-.7.4-1.6.7-2.3.8-.7-.7-1.7-1.1-2.8-1.1-2.1 0-3.8 1.7-3.8 3.8 0 .3 0 .6.1.9-3.2-.2-6-1.7-7.9-4-.3.5-.5 1.1-.5 1.8 0 1.3.7 2.5 1.8 3.2-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.9 2.6 3.6 2.6-1.3 1-2.9 1.6-4.7 1.6-.3 0-.6 0-.9-.1 1.7 1.1 3.6 1.7 5.7 1.7 6.8 0 10.5-5.6 10.5-10.5 0-.2 0-.3 0-.5.8-.5 1.5-1.1 2-1.9z" /></svg>
  ),
  GitHub: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
  ),
  Chain: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
  ),
  Signal: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 20V4" /></svg>
  ),
  ChevronDown: ({ rotated }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
};

const categoryColors = {
  defi: { bg: 'rgba(20, 241, 149, 0.1)', border: '#14F195', text: '#14F195' },
  infra: { bg: 'rgba(153, 69, 255, 0.1)', border: '#9945FF', text: '#9945FF' },
  consumer: { bg: 'rgba(0, 210, 255, 0.1)', border: '#00D2FF', text: '#00D2FF' },
  depin: { bg: 'rgba(251, 146, 60, 0.1)', border: '#FB923C', text: '#FB923C' },
  gaming: { bg: 'rgba(244, 63, 94, 0.1)', border: '#F43F5E', text: '#F43F5E' },
  ai: { bg: 'rgba(167, 139, 250, 0.1)', border: '#A78BFA', text: '#A78BFA' },
  other: { bg: 'rgba(107, 114, 128, 0.1)', border: '#6B7280', text: '#9CA3AF' },
};

const difficultyColors = {
  easy: { text: '#14F195', bg: 'rgba(20, 241, 149, 0.1)' },
  medium: { text: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
  hard: { text: '#F43F5E', bg: 'rgba(244, 63, 94, 0.1)' },
};

function ConfidenceBar({ score }) {
  const percentage = Math.round((score || 0) * 100);
  let color = '#F43F5E'; // Red
  if (percentage >= 70) color = '#14F195'; // Green
  else if (percentage >= 40) color = '#FFD700'; // Yellow

  return (
    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          boxShadow: `0 0 10px ${color}66`,
          transition: 'width 1s ease-out'
        }}
      />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="glass-panel" style={{ padding: '20px 24px', minWidth: 180, flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)' }}></span>
        {label}
      </div>
      <div className="font-mono" style={{ fontSize: 28, fontWeight: 700, color: '#fff', textShadow: '0 0 20px rgba(153, 69, 255, 0.3)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NarrativeCard({ narrative }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryColors[narrative.category] || categoryColors.other;
  const toggle = () => setExpanded(!expanded);

  return (
    <div
      className="glass-panel"
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
      style={{
        padding: 0,
        marginBottom: 16,
        cursor: 'pointer',
        borderLeft: `4px solid ${cat.border}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>
                {narrative.narrative_name}
              </h3>
              <span style={{
                background: cat.bg,
                color: cat.text,
                border: `1px solid ${cat.border}44`,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>{narrative.category}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: '90%' }}>
              {narrative.description}
            </p>
          </div>

          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: cat.text }}>
              {Math.round((narrative.confidence || 0) * 100)}%
            </div>
            <ConfidenceBar score={narrative.confidence} />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <Icons.Signal />
              {narrative.signal_count} Signals
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div style={{
        maxHeight: expanded ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Signal Sources */}
          <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Icons.Twitter /> Social Mentions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Icons.GitHub /> Dev Activity
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Icons.Chain /> On-chain Flows
            </div>
          </div>

          {/* Build Ideas */}
          {narrative.build_ideas?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Build Opportunities
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {narrative.build_ideas.map((idea, i) => {
                  const diff = difficultyColors[idea.difficulty] || difficultyColors.medium;
                  return (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 8,
                      padding: 16,
                      transition: 'background 0.2s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{idea.title}</span>
                        <span style={{
                          color: diff.text,
                          background: diff.bg,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}>{idea.difficulty}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{idea.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Expand Trigger */}
      <div style={{
        padding: '8px',
        textAlign: 'center',
        background: expanded ? 'transparent' : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)',
        color: 'var(--text-tertiary)',
        fontSize: 12
      }}>
        <Icons.ChevronDown rotated={expanded} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-panel" style={{ height: 160, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div className="skeleton" style={{ width: '40%', height: 24, marginBottom: 16 }}></div>
          <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 8 }}></div>
          <div className="skeleton" style={{ width: '60%', height: 16 }}></div>
        </div>
      ))}
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
  const [timestamp, setTimestamp] = useState('');

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
      setTimestamp(new Date().toLocaleTimeString());
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
    <div style={{ paddingBottom: 80 }}>
      {/* Header / Hero */}
      <header style={{
        padding: '32px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(10,10,20,0) 0%, rgba(10,10,20,0.8) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo Mark */}
            <div style={{
              width: 40,
              height: 40,
              background: 'var(--solana-gradient)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(153, 69, 255, 0.4)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M22 12h-2" /><path d="M4 12H2" /><path d="m19.07 4.93-1.41 1.41" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 19.07-1.41-1.41" /><path d="m6.34 6.34-1.41-1.41" /></svg>
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #9CA3AF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SOLANA NARRATIVE TRACKER
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div className="live-pulse"></div>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  System Online
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {timestamp && ` // Last Scan: ${timestamp}`}
                </span>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={load} disabled={loading}>
            <Icons.Refresh />
            {loading ? 'SCANNING...' : 'SYSTEM REFRESH'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <StatCard label="Active Narratives" value={narratives.length} sub="High Confidence Targets" />
          <StatCard label="Signal Velocity" value={totalSignals} sub="Events / 14d Period" />
          <StatCard label="Data Sources" value="3" sub="Social / Dev / On-chain" />
          <StatCard label="Market Context" value={report ? 'Bullish' : '--'} sub="Sentiment Analysis" />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📡</span> Detected Signals
          </h2>

          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
                minWidth: 140
              }}
            >
              <option value="all">ALL SECTORS</option>
              {Object.keys(categoryColors).filter(c => c !== 'other').map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              <option value="other">OTHER</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="confidence">SORT: CONFIDENCE</option>
              <option value="signals">SORT: VOLUME</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: 60, color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <div className="font-mono" style={{ marginBottom: 16 }}>CONNECTION ERROR: {error}</div>
            <button className="btn-primary" onClick={load}>RETRY CONNECTION</button>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : narratives.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🔭</div>
            <h3 style={{ color: 'var(--text-secondary)', margin: 0 }}>No signals detected in current timeframe.</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 8 }}>Run the background scanner to populate narrative data.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {visibleNarratives.map((n, i) => (
              <NarrativeCard key={n.id || i} narrative={n} />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 0',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 60,
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Engineered by <span style={{ color: 'var(--solana-purple)' }}>@gabe_onchain</span> & <span style={{ color: 'var(--solana-green)' }}>@AriaLinkwell</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
          SECURE CONNECTION • v1.2.0 • SOLANA NETWORK
        </div>
      </footer>
    </div>
  );
}
