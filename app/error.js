'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      color: '#FCA5A5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: '#F3F4F6', marginBottom: 8, fontSize: 18 }}>Unexpected dashboard error</div>
        <div style={{ color: '#9CA3AF', marginBottom: 16, fontSize: 14 }}>
          {error?.message || 'Something went wrong while rendering the dashboard.'}
        </div>
        <button
          onClick={reset}
          style={{
            background: 'rgba(252,165,165,0.1)',
            border: '1px solid rgba(252,165,165,0.4)',
            color: '#FCA5A5',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
