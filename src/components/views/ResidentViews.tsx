import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Wrench,
  Zap,
} from 'lucide-react';
import type {
  AppNotification,
  BuildingId,
  HostelBlock,
  LanguageCode,
  Ticket,
  TicketCategory,
  TicketPriority,
  User,
  UserRole,
} from '../../types/domain';
import { isTicketOverdue, loadDraft, saveDraft } from '../../data/mockApi';
import { compressImageFile } from '../../utils/imageCompress';
import { t } from '../../i18n/translations';
import { GlassButton } from '../glass/GlassButton';
import { GlassCard } from '../glass/GlassCard';
import { GlassChip } from '../glass/GlassChip';
import { GlassInput, GlassTextarea } from '../glass/GlassInput';
import { TicketCard } from '../tickets/TicketCard';
import { JourneyTrack2D } from '../tickets/JourneyTrack2D';
import { BUILDINGS } from '../../three/campusData';

const BLOCKS: HostelBlock[] = ['Block A', 'Block B', 'Block C'];

const CATEGORIES: Array<{ id: TicketCategory; hint: string; icon: React.ReactNode }> = [
  { id: 'Plumbing', hint: 'Taps, leaks, flush, drains', icon: <Droplets className="w-5 h-5" /> },
  { id: 'Electrical', hint: 'Fans, lights, sockets, switches', icon: <Zap className="w-5 h-5" /> },
  { id: 'Cleaning', hint: 'Corridors, washrooms, bins', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'Other', hint: 'Doors, locks, furniture, Wi-Fi', icon: <Wrench className="w-5 h-5" /> },
];

const PRIORITIES: Array<{ id: TicketPriority; sla: string; hint: string }> = [
  { id: 'Low', sla: '72h SLA', hint: 'Minor rattle or non-urgent cosmetic fix' },
  { id: 'Medium', sla: '48h SLA', hint: 'Everyday issue, workaround exists' },
  { id: 'High', sla: '24h SLA', hint: 'Fan/light out or major inconvenience' },
  { id: 'Urgent', sla: '4h SLA', hint: 'Active flooding, sparks, or safety risk' },
];

export const ResidentViews: React.FC<{
  activeSegment: string;
  user: User;
  users: User[];
  tickets: Ticket[];
  notifications: AppNotification[];
  lang: LanguageCode;
  is2DMode: boolean;
  onNavigate: (segId: string, building: BuildingId) => void;
  onSubmitTicket: (payload: {
    room: string;
    block: HostelBlock;
    category: TicketCategory;
    priority: TicketPriority;
    description: string;
    photos: string[];
  }) => Ticket;
  onOpenTicket: (ticket: Ticket) => void;
  onTrackTicket: (ticket: Ticket) => void;
  onMarkNotifRead: (id: string) => void;
  onSwitchRole: (role: UserRole, userId?: string) => void;
  onTypingChange: (typing: boolean) => void;
}> = ({
  activeSegment,
  user,
  users,
  tickets,
  notifications,
  lang,
  is2DMode,
  onNavigate,
  onSubmitTicket,
  onOpenTicket,
  onTrackTicket,
  onMarkNotifRead,
  onSwitchRole,
  onTypingChange,
}) => {
  const myTickets = useMemo(
    () => tickets.filter((tk) => tk.residentId === user.id || tk.room === user.room),
    [tickets, user.id, user.room]
  );

  // --- New Ticket 5-step wizard with local draft autosave ---
  const savedDraft = useMemo(() => loadDraft(), []);
  const [step, setStep] = useState(savedDraft?.step ?? 0);
  const [direction, setDirection] = useState(1);
  const [block, setBlock] = useState<HostelBlock>(savedDraft?.block ?? user.block ?? 'Block A');
  const [room, setRoom] = useState(savedDraft?.room ?? user.room ?? 'A-204');
  const [category, setCategory] = useState<TicketCategory>(savedDraft?.category ?? 'Plumbing');
  const [priority, setPriority] = useState<TicketPriority>(savedDraft?.priority ?? 'Medium');
  const [description, setDescription] = useState(savedDraft?.description ?? '');
  const [photos, setPhotos] = useState<string[]>(savedDraft?.photos ?? []);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<Ticket | null>(null);

  // Filters on My Tickets
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    saveDraft({ room, block, category, priority, description, photos, step });
  }, [room, block, category, priority, description, photos, step]);

  const duplicateTicket = useMemo(
    () =>
      tickets.find(
        (tk) =>
          tk.room.trim().toLowerCase() === room.trim().toLowerCase() &&
          tk.category === category &&
          tk.status !== 'Resolved' &&
          tk.status !== 'Closed'
      ),
    [tickets, room, category]
  );

  const filteredTickets = useMemo(() => {
    return myTickets.filter((tk) => {
      const matchesQ =
        !query.trim() ||
        tk.id.toLowerCase().includes(query.toLowerCase()) ||
        tk.description.toLowerCase().includes(query.toLowerCase()) ||
        tk.room.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OVERDUE' ? isTicketOverdue(tk) : tk.status === statusFilter);
      return matchesQ && matchesStatus;
    });
  }, [myTickets, query, statusFilter]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const f of files.slice(0, 3 - photos.length)) {
      setUploadPct(10);
      const url = await compressImageFile(f, 960, 0.72, (p) => setUploadPct(p));
      setPhotos((prev) => [...prev, url]);
      window.setTimeout(() => setUploadPct(null), 300);
    }
  };

  const goStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleConfirmSubmit = () => {
    const created = onSubmitTicket({ room, block, category, priority, description, photos });
    setSubmittedTicket(created);
    saveDraft(null);
    setDescription('');
    setPhotos([]);
    setStep(0);
  };

  // --- HOME SEGMENT ---
  if (activeSegment === 'home') {
    const activeTicket = myTickets.find((tk) => tk.status !== 'Closed') ?? myTickets[0];
    return (
      <div className="space-y-4">
        <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
              The Hostel Quarter · {user.room} ({user.block})
            </p>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Tap a building or file a fix in 60s
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Warm amber windows show open complaints. Every complaint launches a live glass orb.
            </p>
          </div>
          <GlassButton
            variant="amber"
            size="lg"
            icon={<PlusCircle className="w-5 h-5" />}
            onClick={() => {
              setSubmittedTicket(null);
              onNavigate('new_ticket', 'hostel_block');
            }}
          >
            Report Issue
          </GlassButton>
        </GlassCard>

        {activeTicket && (
          <div className="space-y-2">
            {is2DMode && <JourneyTrack2D status={activeTicket.status} overdue={isTicketOverdue(activeTicket)} />}
            <TicketCard
              ticket={activeTicket}
              staff={users.find((u) => u.id === activeTicket.assignedTo)}
              lang={lang}
              onOpen={onOpenTicket}
              onTrack={onTrackTicket}
            />
          </div>
        )}

        {/* Quick 2D/Accessible Campus Building Launcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.values(BUILDINGS).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                if (b.id === 'hostel_block') onNavigate('new_ticket', b.id);
                else if (b.id === 'notice_board') onNavigate('my_tickets', b.id);
                else if (b.id === 'main_gate') onNavigate('profile', b.id);
                else if (b.id === 'feedback_gazebo') onNavigate('my_tickets', b.id);
                else onNavigate('home', b.id);
              }}
              className="glass-lens-card glass-lens-card-interactive p-3 text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <Building2 className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
                <span className="truncate">{b.name}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">{b.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- NEW TICKET (5-STEP LIQUID WAVE WIZARD) ---
  if (activeSegment === 'new_ticket') {
    if (submittedTicket) {
      return (
        <GlassCard className="p-6 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-amber-soft)] border border-[var(--accent-amber)]/60 flex items-center justify-center text-[var(--accent-amber)]"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <div>
            <p className="font-mono-code text-sm font-bold text-[var(--accent-amber)]">{submittedTicket.id}</p>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">
              Complaint launched from Room {submittedTicket.room}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Your glass orb is glowing amber and queued for the Warden. Expected SLA:{' '}
              {new Date(submittedTicket.dueAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <GlassButton variant="amber" onClick={() => onTrackTicket(submittedTicket)}>
              Track in 3D Scene
            </GlassButton>
            <GlassButton
              variant="default"
              onClick={() => {
                setSubmittedTicket(null);
                onNavigate('my_tickets', 'notice_board');
              }}
            >
              View My Tickets
            </GlassButton>
          </div>
        </GlassCard>
      );
    }

    const stepLabels = ['Room', 'Category', 'Priority', 'Details & Photo', 'Review'];

    return (
      <GlassCard className="p-5 sm:p-6 space-y-5">
        {/* Liquid Wave Stepper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              Step {step + 1} of 5 · {stepLabels[step]}
            </span>
            <span className="text-[var(--text-muted)]">Autosaved locally</span>
          </div>
          <div className="relative h-2 rounded-full bg-[var(--glass-bg)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-amber)]/70 to-[var(--accent-amber)]"
              animate={{ width: `${((step + 1) / 5) * 100}%` }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Which hostel block and room?
                </h2>
                <div className="grid grid-cols-3 gap-2.5">
                  {BLOCKS.map((b) => (
                    <GlassChip key={b} label={b} selected={block === b} onClick={() => setBlock(b)} />
                  ))}
                </div>
                <GlassInput
                  label="Room Number"
                  value={room}
                  placeholder="e.g. A-204"
                  onFocus={() => onTypingChange(true)}
                  onBlur={() => onTypingChange(false)}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  What needs fixing?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((c) => (
                    <GlassChip
                      key={c.id}
                      large
                      label={t(lang, `category.${c.id}`)}
                      sublabel={c.hint}
                      icon={c.icon}
                      selected={category === c.id}
                      onClick={() => setCategory(c.id)}
                    />
                  ))}
                </div>
                {duplicateTicket && (
                  <div className="glass-lens-card p-3.5 border-[var(--accent-amber)]/60 bg-[var(--accent-amber-soft)] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-[var(--text-primary)]">
                          Open ticket {duplicateTicket.id} already exists for {room} ({category})
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          You can view its live timeline or continue filing if this is a separate issue.
                        </p>
                      </div>
                    </div>
                    <GlassButton size="sm" onClick={() => onOpenTicket(duplicateTicket)}>
                      View
                    </GlassButton>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  How urgent is it?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRIORITIES.map((p) => (
                    <GlassChip
                      key={p.id}
                      large
                      label={`${t(lang, `priority.${p.id}`)} · ${p.sla}`}
                      sublabel={p.hint}
                      icon={
                        p.id === 'Urgent' ? (
                          <Flame className="w-5 h-5 text-[var(--accent-amber)]" />
                        ) : undefined
                      }
                      selected={priority === p.id}
                      onClick={() => setPriority(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Describe the issue & add a photo
                </h2>
                <GlassTextarea
                  label="What happened?"
                  placeholder="e.g. Washbasin tap won't shut off and is leaking steadily..."
                  value={description}
                  onFocus={() => onTypingChange(true)}
                  onBlur={() => onTypingChange(false)}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="glass-lens-btn px-4 min-h-[44px] inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <Camera className="w-4 h-4 text-[var(--accent-amber)]" />
                      <span>Upload / Camera ({photos.length}/3)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={photos.length >= 3}
                        className="sr-only"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                    {uploadPct !== null && (
                      <div className="flex items-center gap-2 text-xs text-[var(--accent-amber)]">
                        <span className="w-5 h-5 rounded-full border-2 border-[var(--accent-amber)] border-t-transparent animate-spin" />
                        <span>Compressing {uploadPct}%</span>
                      </div>
                    )}
                  </div>
                  {photos.length > 0 && (
                    <div className="flex gap-2.5 flex-wrap">
                      {photos.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 rounded-2xl object-cover border border-[var(--glass-border-top)]"
                          />
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/75 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Review & launch your complaint orb
                </h2>
                <div className="glass-lens-card p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Location</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {block} · Room {room}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Category</span>
                    <span className="font-semibold text-[var(--text-primary)]">{category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Priority</span>
                    <span className="font-semibold text-[var(--accent-amber)]">{priority}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--glass-border-side)]/40">
                    <span className="text-xs text-[var(--text-muted)] block mb-1">Description</span>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      {description || 'No extra notes provided.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          <GlassButton
            variant="ghost"
            disabled={step === 0}
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => goStep(step - 1)}
          >
            Back
          </GlassButton>
          {step < 4 ? (
            <GlassButton
              variant="amber"
              disabled={(step === 0 && !room.trim()) || (step === 3 && !description.trim())}
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => goStep(step + 1)}
            >
              Next
            </GlassButton>
          ) : (
            <GlassButton variant="amber" onClick={handleConfirmSubmit}>
              {t(lang, 'action.submit')}
            </GlassButton>
          )}
        </div>
      </GlassCard>
    );
  }

  // --- MY TICKETS ---
  if (activeSegment === 'my_tickets') {
    return (
      <div className="space-y-4">
        <GlassCard className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              {t(lang, 'nav.myTickets')} ({filteredTickets.length})
            </h2>
            <div className="w-full sm:w-64">
              <GlassInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Search ID, room, issue..."
                value={query}
                onFocus={() => onTypingChange(true)}
                onBlur={() => onTypingChange(false)}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'Open', 'Assigned', 'In progress', 'Resolved', 'OVERDUE'].map((st) => (
              <GlassChip
                key={st}
                label={st === 'ALL' ? 'All' : st === 'OVERDUE' ? 'Overdue' : st}
                selected={statusFilter === st}
                onClick={() => setStatusFilter(st)}
              />
            ))}
          </div>
        </GlassCard>

        {filteredTickets.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-3">
            {/* Sleeping campus cat empty state illustration */}
            <svg className="w-20 h-16 mx-auto text-[var(--accent-amber)]/80" viewBox="0 0 80 64" fill="none">
              <ellipse cx="40" cy="44" rx="24" ry="12" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="24" cy="36" r="9" stroke="currentColor" strokeWidth="2.2" />
              <path d="M18 28 L16 20 L23 26 M27 26 L31 20 L31 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M60 44 Q72 38 66 28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <text x="48" y="22" fill="currentColor" fontSize="10" fontFamily="monospace">zZ</text>
            </svg>
            <p className="text-base font-semibold text-[var(--text-primary)]">{t(lang, 'empty.tickets')}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Try clearing filters or file a new complaint if something needs attention.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTickets.map((tk, idx) => (
              <TicketCard
                key={tk.id}
                ticket={tk}
                index={idx}
                staff={users.find((u) => u.id === tk.assignedTo)}
                lang={lang}
                onOpen={onOpenTicket}
                onTrack={onTrackTicket}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- ALERTS ---
  if (activeSegment === 'alerts') {
    const mine = notifications.filter((n) => n.userId === user.id);
    return (
      <GlassCard className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--accent-amber)]" />
            <span>{t(lang, 'nav.alerts')}</span>
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {mine.filter((n) => !n.readAt).length} unread
          </span>
        </div>
        {mine.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">All caught up.</p>
        ) : (
          <div className="space-y-2.5">
            {mine.map((n) => {
              const linked = tickets.find((tk) => tk.id === n.ticketId);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onMarkNotifRead(n.id);
                    if (linked) onOpenTicket(linked);
                  }}
                  className={`w-full text-left glass-lens-card p-3.5 flex items-start justify-between gap-3 cursor-pointer ${
                    !n.readAt ? 'ring-1 ring-[var(--accent-amber)]/50' : 'opacity-80'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.body}</p>
                  </div>
                  {!n.readAt && <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-amber)] shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>
    );
  }

  // --- PROFILE / MAIN GATE SIGN OUT ---
  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] font-bold flex items-center justify-center">
            {user.avatarInitials}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{user.name}</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {t(lang, `role.${user.role}`)} · {user.block} · Room {user.room}
            </p>
          </div>
        </div>
        <GlassButton variant="amber" onClick={() => onSwitchRole(user.role)}>
          Switch Account / Logout
        </GlassButton>
      </div>

      <div className="pt-3 border-t border-[var(--glass-border-side)]/40 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Your Room Summary</span>
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Showing {myTickets.length} complaint(s) filed under {user.name} / Room {user.room}. Sign out to enter as Warden or another student.
        </p>
      </div>
    </GlassCard>
  );
};
