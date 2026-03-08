'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getRepository } from '@/lib/data/sync-repository';
import { getLocalStorage } from '@/lib/storage/local-storage';
import { PAYOUT_STORAGE_KEY, SELECTED_GROUP_CHANGED_EVENT } from '@/lib/constants';
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

function getInitialFilters(): GameHistoryFilters {
  if (typeof window === 'undefined') return defaultFilters;
  const saved = getLocalStorage<{ selectedGroupId?: string }>(PAYOUT_STORAGE_KEY);
  const groupId = saved?.selectedGroupId ?? null;
  return { ...defaultFilters, groupId: groupId || null };
}

export function useGameHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DbGameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GameHistoryFilters>(getInitialFilters);

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

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedGroupId: string | null }>).detail;
      if (detail && 'selectedGroupId' in detail) {
        setFiltersState((prev) => ({ ...prev, groupId: detail.selectedGroupId ?? null }));
      }
    };
    window.addEventListener(SELECTED_GROUP_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SELECTED_GROUP_CHANGED_EVENT, handler);
  }, []);

  return { sessions, loading, error, filters, setFilters, reload };
}
