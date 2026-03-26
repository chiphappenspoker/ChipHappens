import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DbGameSession } from '../types';

const mockUpsert = vi.fn();

vi.mock('../supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: (...args: unknown[]) => mockUpsert(...args),
    })),
  },
}));

const session: DbGameSession = {
  id: 'session-1',
  created_by: 'user-1',
  group_id: 'group-1',
  session_date: '2026-03-26',
  currency: 'EUR',
  default_buy_in: '30',
  settlement_mode: 'greedy',
  status: 'settled',
  share_code: '',
  created_at: '2026-03-26T10:00:00.000Z',
  updated_at: '2026-03-26T10:00:00.000Z',
};

describe('cloudRepository.saveGameSession', () => {
  beforeEach(() => {
    mockUpsert.mockReset();
  });

  it('throws when Supabase upsert fails', async () => {
    mockUpsert.mockResolvedValue({
      error: { message: 'new row violates row-level security policy' },
    });

    const { cloudRepository } = await import('./cloud-repository');

    await expect(cloudRepository.saveGameSession(session)).rejects.toMatchObject({
      message: 'new row violates row-level security policy',
    });
  });
});
