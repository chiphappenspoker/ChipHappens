'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useGroups } from '@/hooks/useGroups';
import { getRepository } from '@/lib/data/sync-repository';
import { fmt } from '@/lib/calc/formatting';
import { useEffect, useState } from 'react';
import type { DbGameSession, DbGamePlayer } from '@/lib/types';

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { groups } = useGroups();
  const [session, setSession] = useState<DbGameSession | null | undefined>(undefined);
  const [players, setPlayers] = useState<DbGamePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const getGroupName = (groupId: string | null): string => {
    if (!groupId) return 'No group';
    const g = groups.find((x) => x.id === groupId);
    return g?.name ?? 'No group';
  };

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setPlayers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const repo = getRepository(!!user);
    Promise.all([repo.getGameSession(sessionId), repo.getGamePlayers(sessionId)])
      .then(([s, p]) => {
        if (!cancelled) {
          setSession(s ?? null);
          setPlayers(p ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setPlayers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, user]);

  if (authLoading || (sessionId && loading && session === undefined)) {
    return (
      <div className="app-shell">
        <main className="app-main max-w-md mx-auto text-center py-10 px-4">
          <p className="muted-text">Loading…</p>
        </main>
      </div>
    );
  }

  if (!sessionId || session == null) {
    return (
      <div className="app-shell">
        <main className="app-main max-w-md mx-auto text-center py-10 px-4">
          <h1 className="text-xl font-semibold mb-2">Session not found</h1>
          <p className="muted-text mb-4">This session does not exist or you don't have access to it.</p>
          <Link href="/history" className="btn btn-primary">
            Back to history
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main max-w-md mx-auto py-10 px-4">
        <p className="mb-4">
          <Link href="/history" className="text-sm muted-text underline">
            ← Back to history
          </Link>
        </p>
        <h1 className="text-xl font-semibold mb-4">Session details</h1>

        <div className="settings-list mb-6">
          <div className="settings-field">
            <span className="settings-label">Date</span>
            <span>{formatSessionDate(session.session_date)}</span>
          </div>
          <div className="settings-field">
            <span className="settings-label">Group</span>
            <span>{getGroupName(session.group_id)}</span>
          </div>
          <div className="settings-field">
            <span className="settings-label">Currency</span>
            <span>{session.currency}</span>
          </div>
          <div className="settings-field">
            <span className="settings-label">Default buy-in</span>
            <span>{session.default_buy_in}</span>
          </div>
          <div className="settings-field">
            <span className="settings-label">Settlement mode</span>
            <span>{session.settlement_mode === 'greedy' ? 'Greedy' : 'Banker'}</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">Players</h2>
        {players.length === 0 ? (
          <p className="muted-text">No players in this session.</p>
        ) : (
          <div className="table-wrap">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th className="text-right">Buy-in</th>
                  <th className="text-right">Cash out</th>
                  <th className="text-right">Net</th>
                  <th>Settled</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
                    <td>{p.player_name}</td>
                    <td className="text-right font-mono tabular-nums">{fmt(p.buy_in)}</td>
                    <td className="text-right font-mono tabular-nums">{fmt(p.cash_out)}</td>
                    <td className="text-right font-mono tabular-nums">{fmt(p.net_result)}</td>
                    <td>{p.settled ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
