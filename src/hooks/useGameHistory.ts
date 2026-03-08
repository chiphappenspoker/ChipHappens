'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getRepository } from '@/lib/data/sync-repository';
import type { DbGameSession } from '@/lib/types';

export interface GameHistoryFilters {
  groupId: string | null;
  fromDate: string;
  toDate: string;
}

const defaultFilters: GameHistoryFilters = {
  groupId: null,
  fromDate: '',
  toDate: '',
};

export function useGameHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DbGameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GameHistoryFilters>(defaultFilters);

  const setFilters = useCallback((update: Partial<GameHistoryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
  }, []);

  const reload = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const repo = getRepository(true);
      const list = await repo.getGameSessionsForUser({
        groupId: filters.groupId ?? undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });
      setSessions(list);
    } catch (e) {
      setError((e as Error).message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters.groupId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }
    reload();
  }, [user, reload]);

  return { sessions, loading, error, filters, setFilters, reload };
}
