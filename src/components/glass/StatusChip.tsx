import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  CircleDot,
  Clock,
  Flame,
  Lock,
  Minus,
  RotateCcw,
  UserCheck,
  Wrench,
} from 'lucide-react';
import type { LanguageCode, TicketPriority, TicketStatus } from '../../types/domain';
import { t } from '../../i18n/translations';

export const StatusChip: React.FC<{
  status: TicketStatus;
  overdue?: boolean;
  lang?: LanguageCode;
  layoutId?: string;
}> = ({ status, overdue = false, lang = 'en', layoutId }) => {
  const effectiveLabel = overdue && status !== 'Resolved' && status !== 'Closed'
    ? t(lang, 'status.Overdue')
    : t(lang, `status.${status}`);

  const iconMap: Record<TicketStatus, React.ReactNode> = {
    Open: <CircleDot className="w-3.5 h-3.5" aria-hidden="true" />,
    Assigned: <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />,
    'In progress': <Wrench className="w-3.5 h-3.5" aria-hidden="true" />,
    'Waiting for parts': <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
    Resolved: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
    Closed: <Lock className="w-3.5 h-3.5" aria-hidden="true" />,
    Reopened: <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />,
  };

  const toneCls = overdue && status !== 'Resolved' && status !== 'Closed'
    ? 'bg-[var(--accent-amber-soft)] border-[var(--accent-amber)]/60 text-[var(--accent-amber)]'
    : status === 'Resolved' || status === 'Closed'
      ? 'bg-emerald-500/15 border-emerald-400/35 text-[var(--text-primary)]'
      : status === 'Reopened'
        ? 'bg-amber-500/18 border-amber-400/45 text-[var(--accent-amber)]'
        : 'bg-[var(--glass-bg)] border-[var(--glass-border-side)] text-[var(--text-primary)]';

  return (
    <motion.span
      layoutId={layoutId}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${toneCls}`}
    >
      {overdue && status !== 'Resolved' && status !== 'Closed' ? (
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        iconMap[status]
      )}
      <span>{effectiveLabel}</span>
    </motion.span>
  );
};

export const PriorityChip: React.FC<{
  priority: TicketPriority;
  lang?: LanguageCode;
}> = ({ priority, lang = 'en' }) => {
  const iconMap: Record<TicketPriority, React.ReactNode> = {
    Low: <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />,
    Medium: <Minus className="w-3.5 h-3.5" aria-hidden="true" />,
    High: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />,
    Urgent: <Flame className="w-3.5 h-3.5 text-[var(--accent-amber)]" aria-hidden="true" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        priority === 'Urgent'
          ? 'bg-[var(--accent-amber-soft)] border-[var(--accent-amber)]/50 text-[var(--accent-amber)]'
          : 'bg-[var(--glass-bg)] border-[var(--glass-border-side)] text-[var(--text-secondary)]'
      }`}
    >
      {iconMap[priority]}
      <span>{t(lang, `priority.${priority}`)}</span>
    </span>
  );
};
