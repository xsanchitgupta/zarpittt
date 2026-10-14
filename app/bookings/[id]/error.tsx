'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Booking detail page error:', error);
  }, [error]);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2 style={{ color: 'red' }}>Something went wrong!</h2>
      <p>{error.message}</p>
      <pre style={{ textAlign: 'left', background: '#eee', padding: 10 }}>{error.stack}</pre>
      <button
        onClick={() => reset()}
        style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white' }}
      >
        Try again
      </button>
    </div>
  );
}
