import React, { useState } from 'react';
import { BellRing, Camera, CheckCircle2, Clock, MapPin, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { LanguageCode, Ticket, TimelineEvent, User, UserRole } from '../../types/domain';
import { isTicketOverdue } from '../../data/mockApi';
import { stationIndexToNormalizedProgress, statusToStationIndex } from '../../controllers/AnimationController';
import { compressImageFile } from '../../utils/imageCompress';
import { t } from '../../i18n/translations';
import { GlassModal } from './GlassModal';
import { GlassButton } from './GlassButton';
import { GlassTextarea } from './GlassInput';
import { PriorityChip, StatusChip } from './StatusChip';
import { RatingStars } from './RatingStars';
import { TimelineAnimated } from '../tickets/TimelineAnimated';
import { JourneyTrack2D } from '../tickets/JourneyTrack2D';

export interface TicketDetailModalProps {
  ticket: Ticket | null;
  events: TimelineEvent[];
  staffList: User[];
  currentRole: UserRole;
  lang: LanguageCode;
  is2DMode: boolean;
  onClose: () => void;
  onTrack: (ticket: Ticket, scrubProgress?: number) => void;
  onNudgeWarden: (ticket: Ticket) => void;
  onConfirmAndRate: (ticket: Ticket, rating: number, comment: string) => void;
  onReopenTicket: (ticket: Ticket, reason: string, photo?: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  events,
  staffList,
  currentRole,
  lang,
  is2DMode,
  onClose,
  onTrack,
  onNudgeWarden,
  onConfirmAndRate,
  onReopenTicket,
}) => {
  const [scrub, setScrub] = useState<number>(0);
  const [confirmMode, setConfirmMode] = useState<'none' | 'yes' | 'no'>('none');
  const [rating, setRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [reopenPhoto, setReopenPhoto] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (ticket) {
      const idx = statusToStationIndex(ticket.status, false);
      setScrub(stationIndexToNormalizedProgress(idx));
      setConfirmMode('none');
      setRating(ticket.rating ?? 5);
      setRatingComment('');
      setReopenReason('');
      setReopenPhoto(undefined);
    }
  }, [ticket?.id, ticket?.status]);

  if (!ticket) return null;

  const overdue = isTicketOverdue(ticket);
  const assignedStaff = staffList.find((u) => u.id === ticket.assignedTo);
  const ticketEvents = events.filter((e) => e.ticketId === ticket.id);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file);
    setReopenPhoto(compressed);
  };

  return (
    <GlassModal
      open={Boolean(ticket)}
      onClose={onClose}
      title={`${ticket.id} · ${t(lang, `category.${ticket.category}`)}`}
      subtitle={`Room ${ticket.room} (${ticket.block}) · Expected by ${new Date(ticket.dueAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Status summary bar */}
        <div className="glass-lens-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip status={ticket.status} overdue={overdue} lang={lang} />
            <PriorityChip priority={ticket.priority} lang={lang} />
            {assignedStaff && (
              <span className="text-xs text-[var(--text-secondary)]">
                Assigned to <strong className="text-[var(--text-primary)]">{assignedStaff.name}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {overdue && currentRole === 'resident' && (
              <GlassButton
                size="sm"
                variant="default"
                icon={<BellRing className="w-3.5 h-3.5 text-[var(--accent-amber)]" />}
                onClick={() => onNudgeWarden(ticket)}
              >
                {ticket.nudgedAt ? 'Nudged' : t(lang, 'action.nudge')}
              </GlassButton>
            )}
            <GlassButton
              size="sm"
              variant="amber"
              icon={<MapPin className="w-3.5 h-3.5" />}
              onClick={() => onTrack(ticket)}
            >
              {t(lang, 'action.track')}
            </GlassButton>
          </div>
        </div>

        {/* Description & Resident Photos */}
        <div className="glass-lens-card p-4 space-y-3">
          <p className="text-sm text-[var(--text-primary)]">{ticket.description}</p>
          {ticket.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ticket.photos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Complaint upload ${i + 1}`}
                  className="h-20 w-24 rounded-xl object-cover border border-[var(--glass-border-side)]"
                />
              ))}
            </div>
          )}
        </div>

        {/* 2D Station Track Fallback (always visible in 2D mode, compact summary in 3D) */}
        {is2DMode && <JourneyTrack2D status={ticket.status} overdue={overdue} />}

        {/* Resident Confirm Resolution & Rating (when Resolved) */}
        {currentRole === 'resident' && ticket.status === 'Resolved' && (
          <div className="glass-lens-card p-4 space-y-4 border-[var(--accent-amber)]/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Is it fixed?</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Confirm if the issue in {ticket.room} is completely resolved, or reopen if it persists.
                </p>
              </div>
              {confirmMode === 'none' && (
                <div className="flex items-center gap-2">
                  <GlassButton
                    size="sm"
                    variant="amber"
                    icon={<ThumbsUp className="w-3.5 h-3.5" />}
                    onClick={() => setConfirmMode('yes')}
                  >
                    Yes, fixed
                  </GlassButton>
                  <GlassButton
                    size="sm"
                    variant="danger"
                    icon={<ThumbsDown className="w-3.5 h-3.5" />}
                    onClick={() => setConfirmMode('no')}
                  >
                    No, reopen
                  </GlassButton>
                </div>
              )}
            </div>

            {confirmMode === 'yes' && (
              <div className="space-y-3 pt-2 border-t border-[var(--glass-border-side)]/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Rate the service:</span>
                  <RatingStars value={rating} onChange={setRating} />
                </div>
                <GlassTextarea
                  label="Optional comment"
                  placeholder="How was the repair quality and speed?"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <GlassButton size="sm" variant="ghost" onClick={() => setConfirmMode('none')}>
                    Cancel
                  </GlassButton>
                  <GlassButton
                    size="sm"
                    variant="amber"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => onConfirmAndRate(ticket, rating, ratingComment)}
                  >
                    Confirm & Submit Rating
                  </GlassButton>
                </div>
              </div>
            )}

            {confirmMode === 'no' && (
              <div className="space-y-3 pt-2 border-t border-[var(--glass-border-side)]/40">
                <GlassTextarea
                  label="What still needs fixing?"
                  placeholder="Describe what is still leaking, flickering, or incomplete..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="glass-lens-btn px-4 min-h-[40px] inline-flex items-center gap-2 text-xs cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{reopenPhoto ? 'Photo attached' : 'Attach photo'}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
                  </label>
                  <div className="flex gap-2">
                    <GlassButton size="sm" variant="ghost" onClick={() => setConfirmMode('none')}>
                      Cancel
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      variant="danger"
                      disabled={!reopenReason.trim()}
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => onReopenTicket(ticket, reopenReason.trim(), reopenPhoto)}
                    >
                      Reopen Complaint
                    </GlassButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Closed Rating Summary */}
        {ticket.status === 'Closed' && ticket.rating && (
          <div className="glass-lens-card p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Confirmed Closed by Resident</p>
              {ticket.ratingComment && (
                <p className="text-xs text-[var(--text-secondary)]">“{ticket.ratingComment}”</p>
              )}
            </div>
            <RatingStars value={ticket.rating} readonly size="sm" />
          </div>
        )}

        {/* Vertical Animated Timeline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ticket Timeline ({ticketEvents.length})</span>
          </div>
          <TimelineAnimated
            events={ticketEvents}
            lang={lang}
            isLiveWorking={ticket.status === 'In progress'}
            scrubValue={scrub}
            onScrubChange={(val) => {
              setScrub(val);
              onTrack(ticket, val);
            }}
          />
        </div>
      </div>
    </GlassModal>
  );
};
