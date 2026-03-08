'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { JoinByCodeContent } from './[code]/JoinByCodeContent';

function JoinPageContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('code') ?? '';
  const code = raw ? decodeURIComponent(raw) : '';
  return <JoinByCodeContent code={code} />;
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap">
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="muted-text">Loading…</p>
          </div>
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
