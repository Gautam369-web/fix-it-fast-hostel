import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, MapPin, Sparkles, UserCheck, Wrench, Zap } from 'lucide-react';
import type { LanguageCode, Ticket, TicketCategory, User } from '../../types/domain';
import { isTicketOverdue } from '../../data/mockApi';
import { t } from '../../i18n/translations';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';
import { PriorityChip, StatusChip } from '../glass/StatusChip';

export function categoryIcon(cat: TicketCategory) {
  switch (cat) {
    case 'Plumbing':
      return <Droplets className="w-4 h-4" aria-hidden="true" />;
    case 'Electrical':
      return <Zap className="w-4 h-4" aria-hidden="true" />;
    case 'Cleaning':
      return <Sparkles className="w-4 h-4" aria-hidden="true" />;
    default:
      return <Wrench className="w-4 h-4" aria-hidden="true" />;
  }
}

function formatAge(iso: string): string {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const TicketCard: React.FC<{
  ticket: Ticket;
  staff?: User;
  lang: LanguageCode;
  index?: number;
  onOpen: (ticket: Ticket) => void;
  onTrack: (ticket: Ticket) => void;
}> = ({ ticket, staff, lang, index = 0, onOpen, onTrack }) => {
  const overdue = isTicketOverdue(ticket);

  return (
    <motion.div
      layoutId={`ticket-card-${ticket.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.3), type: 'spring', stiffness: 260, damping: 24 }}
    >
      <GlassCard interactive overdue={overdue} onClick={() => onOpen(ticket)} className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] flex items-center justify-center shrink-0">
              {categoryIcon(ticket.category)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono-code text-xs font-semibold text-[var(--text-primary)]">
                  {ticket.id}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{formatAge(ticket.createdAt)}</span>
                {ticket.offlineQueued && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-[var(--accent-amber)]">
                    Queued offline
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {t(lang, `category.${ticket.category}`)} · Room {ticket.room}
              </p>
            </div>
          </div>
          <StatusChip status={ticket.status} overdue={overdue} lang={lang} />
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">{ticket.description}</p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--glass-border-side)]/40 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityChip priority={ticket.priority} lang={lang} />
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {staff ? staff.name : 'Unassigned'}
            </span>
          </div>
          <GlassButton
            size="sm"
            variant="amber"
            icon={<MapPin className="w-3.5 h-3.5" />}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onTrack(ticket);
            }}
          >
            {t(lang, 'action.track')}
          </GlassButton>
        </div>
      </GlassCard>
    </motion.div>
  );
};
