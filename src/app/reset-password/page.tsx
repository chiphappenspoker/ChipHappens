'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { BASE_PATH } from '@/lib/constants';
import { useAuth } from '@/lib/auth/AuthProvider';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M3 13c2.2-3 5.2-4.5 9-4.5s6.8 1.5 9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 16.2 7 14.4M9.3 17.7l1-2.3M14.7 17.7l-1-2.3M19 16.2 17 14.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function recoveryTokensPresent(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(hash).get('type');
  if (fromHash === 'recovery') return true;
  return new URLSearchParams(window.location.search).get('type') === 'recovery';
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState(recoveryTokensPresent());
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const homeHref = BASE_PATH === '' ? '/' : `${BASE_PATH}/`;

  useEffect(() => {
    if (recoveryTokensPresent()) setAllowed(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAllowed(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const run = async () => {
      const search = new URLSearchParams(window.location.search);
      const token_hash = search.get('token_hash') ?? '';
      const type = search.get('type') ?? '';

      // Scanner-resistant flow: recovery email links to our app with token_hash,
      // then we verify via an API call (scanners won't consume it via a GET).
      if (type === 'recovery' && token_hash && !user) {
        setVerifying(true);
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash,
        });
        setVerifying(false);
        if (verifyErr) {
          setError(verifyErr.message);
          return;
        }
        setAllowed(true);
      }
    };

    void run();
    // user is included so we don't re-verify once a session exists.
  }, [user]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setSubmitting(true);
      const { error: updErr } = await supabase.auth.updateUser({ password });
      setSubmitting(false);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      router.replace(homeHref);
    },
    [password, confirm, router, homeHref]
  );

  if (authLoading || verifying) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{
          background: 'radial-gradient(1200px 700px at 80% -10%, #15151a 0%, var(--color-bg) 60%)',
          color: 'var(--color-text)',
        }}
      >
        <p className="muted-text">{verifying ? 'Verifying reset link…' : 'Loading…'}</p>
      </div>
    );
  }

  if (!allowed || !user) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{
          background: 'radial-gradient(1200px 700px at 80% -10%, #15151a 0%, var(--color-bg) 60%)',
          color: 'var(--color-text)',
        }}
      >
        <div className="card max-w-md w-full p-8">
          <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>
            Reset link invalid or expired
          </h1>
          <p className="muted-text max-w-sm mx-auto mb-6">
            Request a new reset email from the sign-in screen, or open the latest link from your inbox.
          </p>
          <Link href={homeHref} className="ch-btn inline-block text-center no-underline">
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: 'radial-gradient(1200px 700px at 80% -10%, #15151a 0%, var(--color-bg) 60%)',
        color: 'var(--color-text)',
      }}
    >
      <div className="card max-w-md w-full p-8">
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-accent)' }}>
          Choose a new password
        </h1>
        <p className="muted-text text-sm mb-6 max-w-sm mx-auto">
          Signed in as <span className="text-[var(--color-text)]">{user.email}</span>. Enter your new password below.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-2 text-left">
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="ch-input pr-10"
              name="password"
              id="reset-password-new"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="password-toggle-btn"
              onClick={() => setShowPassword(v => !v)}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <div className="relative w-full">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="ch-input pr-10"
              name="confirm"
              id="reset-password-confirm"
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              title={showConfirm ? 'Hide password' : 'Show password'}
              className="password-toggle-btn"
              onClick={() => setShowConfirm(v => !v)}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="ch-btn mt-1" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <Link href={homeHref} className="ch-link text-xs mt-4 inline-block">
          Cancel and return to app
        </Link>
      </div>
    </div>
  );
}
