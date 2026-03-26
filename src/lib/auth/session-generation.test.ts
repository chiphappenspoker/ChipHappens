import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('../supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  },
  isSupabasePlaceholder: false,
}));

describe('bumpSessionGenerationAndStore', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetUser.mockReset();
  });

  it('does not call RPC when there is no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { bumpSessionGenerationAndStore } = await import('./session-generation');
    await bumpSessionGenerationAndStore('user-1');

    expect(mockRpc).not.toHaveBeenCalled();
  });
});
