import {
  loadStore,
  resetStore,
  saveStore,
  type StoreSnapshot,
} from '../data/mockApi';

export type StorageMode = 'local' | 'api' | 'supabase';

export interface TicketRepository {
  mode: StorageMode;
  load: () => StoreSnapshot;
  save: (snapshot: StoreSnapshot) => void;
  reset: () => StoreSnapshot;
}

export function getStorageMode(): StorageMode {
  const configured = import.meta.env.VITE_STORAGE_MODE;
  if (configured === 'api' || configured === 'supabase') return configured;
  return 'local';
}

/**
 * Default repository backed by localStorage + seed data so Vercel deployments
 * run immediately with zero external database setup. When connecting Postgres,
 * Neon, or Supabase later, implement async fetch/sync hooks here without
 * changing UI components.
 */
export const ticketRepository: TicketRepository = {
  mode: getStorageMode(),
  load: () => loadStore(),
  save: (snapshot) => saveStore(snapshot),
  reset: () => resetStore(),
};
