import {
  loadStore,
  resetStore,
  saveStore,
  type StoreSnapshot,
} from '../data/mockApi';

export type StorageMode = 'local' | 'api' | 'supabase';

export interface RemoteSyncResult {
  connected: boolean;
  snapshot?: Partial<StoreSnapshot>;
}

export function getStorageMode(): StorageMode {
  const configured = import.meta.env.VITE_STORAGE_MODE;
  if (configured === 'api' || configured === 'supabase') return configured;
  return 'local';
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Repository bridging localStorage cache (instant UI + offline fallback)
 * and the Vercel `/api/store` Neon Serverless Postgres backend.
 */
export const ticketRepository = {
  mode: getStorageMode(),
  load: (): StoreSnapshot => loadStore(),
  save: (snapshot: StoreSnapshot): void => saveStore(snapshot),
  reset: (): StoreSnapshot => resetStore(),

  async fetchRemote(): Promise<RemoteSyncResult> {
    try {
      const res = await fetch(`${API_BASE}/store`, { method: 'GET' });
      if (!res.ok) return { connected: false };
      const data = await res.json();
      if (data?.ok && data?.mode === 'database' && data?.snapshot) {
        return { connected: true, snapshot: data.snapshot };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  },

  async mutateRemote(action: string, payload: Record<string, unknown>): Promise<RemoteSyncResult> {
    try {
      const res = await fetch(`${API_BASE}/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) return { connected: false };
      const data = await res.json();
      if (data?.ok && data?.mode === 'database' && data?.snapshot) {
        return { connected: true, snapshot: data.snapshot };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  },
};
