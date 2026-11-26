import type {
  AppNotification,
  AppSettings,
  HostelBlock,
  SlaHoursConfig,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TimelineEvent,
  User,
} from '../types/domain';
import {
  DEFAULT_SETTINGS,
  SEED_NOTIFICATIONS,
  SEED_TICKETS,
  SEED_TIMELINE,
  SEED_USERS,
} from './seed';

const STORAGE_KEY = 'fix_it_fast_store_v1';
const DRAFT_KEY = 'fix_it_fast_draft_v1';

export interface StoreSnapshot {
  users: User[];
  tickets: Ticket[];
  timeline: TimelineEvent[];
  notifications: AppNotification[];
  settings: AppSettings;
  tourCompleted: boolean;
}

export interface NewTicketDraft {
  room: string;
  block: HostelBlock;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  photos: string[];
  step: number;
}

export function computeDueAt(createdAtIso: string, priority: TicketPriority, sla: SlaHoursConfig): string {
  const createdMs = new Date(createdAtIso).getTime();
  const hours = sla[priority] ?? 24;
  return new Date(createdMs + hours * 3600_000).toISOString();
}

export function isTicketOverdue(ticket: Ticket, refMs = Date.now()): boolean {
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') return false;
  return new Date(ticket.dueAt).getTime() < refMs;
}

export function loadStore(): StoreSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
      if (parsed.tickets && parsed.users && parsed.timeline) {
        return {
          users: parsed.users,
          tickets: parsed.tickets,
          timeline: parsed.timeline,
          notifications: parsed.notifications ?? SEED_NOTIFICATIONS,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
          tourCompleted: Boolean(parsed.tourCompleted),
        };
      }
    }
  } catch {
    // Fallback to seed on corrupted storage
  }
  const initial: StoreSnapshot = {
    users: SEED_USERS,
    tickets: SEED_TICKETS,
    timeline: SEED_TIMELINE,
    notifications: SEED_NOTIFICATIONS,
    settings: DEFAULT_SETTINGS,
    tourCompleted: false,
  };
  saveStore(initial);
  return initial;
}

export function saveStore(snapshot: StoreSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function resetStore(): StoreSnapshot {
  const fresh: StoreSnapshot = {
    users: SEED_USERS,
    tickets: SEED_TICKETS,
    timeline: SEED_TIMELINE,
    notifications: SEED_NOTIFICATIONS,
    settings: DEFAULT_SETTINGS,
    tourCompleted: false,
  };
  saveStore(fresh);
  return fresh;
}

export function loadDraft(): NewTicketDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as NewTicketDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: NewTicketDraft | null): void {
  try {
    if (!draft) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function nextTicketId(tickets: Ticket[]): string {
  const maxNum = tickets.reduce((acc, item) => {
    const m = /FIF-(\d+)/.exec(item.id);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 1046);
  return `FIF-${maxNum + 1}`;
}

export function makeTimelineEntry(params: {
  ticketId: string;
  actor: User;
  status: TicketStatus;
  note: string;
  photo?: string;
}): TimelineEvent {
  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ticketId: params.ticketId,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    status: params.status,
    note: params.note,
    photo: params.photo,
    timestamp: new Date().toISOString(),
  };
}
