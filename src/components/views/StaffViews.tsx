import React, { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Clock, History, MapPin, UserCheck, Wrench } from 'lucide-react';
import type { LanguageCode, Ticket, TicketStatus, User, UserRole } from '../../types/domain';
import { isTicketOverdue } from '../../data/mockApi';
import { compressImageFile } from '../../utils/imageCompress';
import { t } from '../../i18n/translations';
import { GlassButton } from '../glass/GlassButton';
import { GlassCard } from '../glass/GlassCard';
import { GlassTextarea } from '../glass/GlassInput';
import { PriorityChip, StatusChip } from '../glass/StatusChip';
import { RatingStars } from '../glass/RatingStars';

const PRIO_WEIGHT = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export const StaffViews: React.FC<{
  activeSegment: string;
  staff: User;
  tickets: Ticket[];
  lang: LanguageCode;
  onPostStatusUpdate: (ticketId: string, status: TicketStatus, note: string, photo?: string) => void;
  onOpenTicket: (ticket: Ticket) => void;
  onTrackTicket: (ticket: Ticket) => void;
  onSwitchRole: (role: UserRole, userId?: string) => void;
}> = ({
  activeSegment,
  staff,
  tickets,
  lang,
  onPostStatusUpdate,
  onOpenTicket,
  onTrackTicket,
  onSwitchRole,
}) => {
  const myActiveJobs = useMemo(
    () =>
      tickets
        .filter((tk) => tk.assignedTo === staff.id && tk.status !== 'Resolved' && tk.status !== 'Closed')
        .sort(
          (a, b) =>
            PRIO_WEIGHT[a.priority] - PRIO_WEIGHT[b.priority] ||
            new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
        ),
    [tickets, staff.id]
  );

  const myHistory = useMemo(
    () => tickets.filter((tk) => tk.assignedTo === staff.id && (tk.status === 'Resolved' || tk.status === 'Closed')),
    [tickets, staff.id]
  );

  const [selectedJobId, setSelectedJobId] = useState<string>(myActiveJobs[0]?.id ?? '');
  const [nextStatus, setNextStatus] = useState<TicketStatus>('In progress');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const selectedJob = myActiveJobs.find((j) => j.id === selectedJobId) ?? myActiveJobs[0] ?? null;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await compressImageFile(file));
  };

  if (activeSegment === 'history') {
    return (
      <div className="space-y-3">
        <GlassCard className="p-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--accent-amber)]" />
            <span>Completed Jobs ({myHistory.length})</span>
          </h2>
          <GlassButton size="sm" onClick={() => onSwitchRole('resident', 'res-aarav')}>
            Switch to Resident
          </GlassButton>
        </GlassCard>
        {myHistory.map((tk) => (
          <GlassCard key={tk.id} interactive onClick={() => onOpenTicket(tk)} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-code text-xs font-bold text-[var(--text-primary)]">
                {tk.id} · Room {tk.room}
              </span>
              <StatusChip status={tk.status} lang={lang} />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{tk.description}</p>
            {tk.rating && (
              <div className="flex items-center justify-between pt-1">
                <RatingStars value={tk.rating} readonly size="sm" />
                {tk.ratingComment && <span className="text-xs text-[var(--text-muted)]">“{tk.ratingComment}”</span>}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    );
  }

  if (activeSegment === 'updates' && selectedJob) {
    return (
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs font-mono-code text-[var(--accent-amber)]">{selectedJob.id}</p>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Post Update · Room {selectedJob.room} ({selectedJob.category})
            </h2>
          </div>
          <select
            aria-label="Choose active job"
            value={selectedJob.id}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="glass-lens-input px-3 py-1.5 text-xs min-h-[38px]"
          >
            {myActiveJobs.map((j) => (
              <option key={j.id} value={j.id} className="text-slate-900">
                {j.id} · {j.room}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(
            [
              { status: 'In progress', label: 'Started / Working', icon: <Wrench className="w-4 h-4" /> },
              { status: 'Waiting for parts', label: 'Waiting for parts', icon: <Clock className="w-4 h-4" /> },
              { status: 'Resolved', label: 'Mark Resolved', icon: <CheckCircle2 className="w-4 h-4" /> },
            ] as Array<{ status: TicketStatus; label: string; icon: React.ReactNode }>
          ).map((opt) => (
            <GlassButton
              key={opt.status}
              variant={nextStatus === opt.status ? 'amber' : 'default'}
              icon={opt.icon}
              onClick={() => setNextStatus(opt.status)}
            >
              {opt.label}
            </GlassButton>
          ))}
        </div>

        <GlassTextarea
          label="Technician Note"
          placeholder="e.g. Replaced ceramic spindle and tested water pressure — no leaks."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="glass-lens-btn px-4 min-h-[44px] inline-flex items-center gap-2 text-xs cursor-pointer">
            <Camera className="w-4 h-4 text-[var(--accent-amber)]" />
            <span>{photo ? 'Proof photo ready' : 'Attach completion photo'}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
          </label>
          <GlassButton
            variant="amber"
            disabled={!note.trim()}
            onClick={() => {
              onPostStatusUpdate(selectedJob.id, nextStatus, note.trim(), photo);
              setNote('');
              setPhoto(undefined);
            }}
          >
            Push Update & Move Orb
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  // --- MY JOBS QUEUE ---
  return (
    <div className="space-y-3">
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
            {staff.name} · My Queue ({myActiveJobs.length})
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Sorted by priority & due SLA · Tap a job to post field updates
          </p>
        </div>
        <div className="flex gap-2">
          <GlassButton size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={() => onSwitchRole('resident', 'res-aarav')}>
            Resident
          </GlassButton>
          <GlassButton size="sm" onClick={() => onSwitchRole('warden', 'war-kavita')}>
            Warden
          </GlassButton>
        </div>
      </GlassCard>

      {myActiveJobs.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-base font-semibold text-[var(--text-primary)]">{t(lang, 'empty.tickets')}</p>
        </GlassCard>
      ) : (
        myActiveJobs.map((tk) => {
          const overdue = isTicketOverdue(tk);
          return (
            <GlassCard key={tk.id} overdue={overdue} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs font-bold text-[var(--accent-amber)]">{tk.id}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Room {tk.room} ({tk.block})
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{tk.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityChip priority={tk.priority} lang={lang} />
                  <StatusChip status={tk.status} overdue={overdue} lang={lang} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--glass-border-side)]/40 flex-wrap">
                <GlassButton size="sm" onClick={() => onTrackTicket(tk)} icon={<MapPin className="w-3.5 h-3.5" />}>
                  Track
                </GlassButton>
                <GlassButton size="sm" onClick={() => onOpenTicket(tk)}>
                  Timeline
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="amber"
                  onClick={() => {
                    setSelectedJobId(tk.id);
                    onPostStatusUpdate(tk.id, tk.status === 'Assigned' ? 'In progress' : 'Resolved',
                      tk.status === 'Assigned' ? 'Started inspection on-site.' : 'Fixed and verified working.');
                  }}
                >
                  {tk.status === 'Assigned' ? 'Quick Start' : 'Quick Resolve'}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })
      )}
    </div>
  );
};
