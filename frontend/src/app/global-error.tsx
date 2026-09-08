'use client';

/**
 * Root-level fallback rendered when the root <html>/<body> layout itself fails
 * to render. Must define its own <html>/<body> and stays dependency-free and
 * self-contained (uses inline styles) so it works even when fonts/CSS/app CSS
 * fail to load. With `output: 'export'` this covers client-side root crashes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 480 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
            We encountered an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#e11d48',
              color: '#fff',
              border: 0,
              borderRadius: 9999,
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}