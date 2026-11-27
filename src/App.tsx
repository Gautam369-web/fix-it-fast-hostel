import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Eye,
  LogOut,
  Settings,
  WifiOff,
} from 'lucide-react';
import type {
  AppNotification,
  AppSettings,
  BuildingId,
  DockSegment,
  HostelBlock,
  OrbJourneyState,
  SlaHoursConfig,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
  UserRole,
} from './types/domain';
import {
  computeDueAt,
  isTicketOverdue,
  makeTimelineEntry,
  nextTicketId,
  type StoreSnapshot,
} from './data/mockApi';
import { ticketRepository } from './services/ticketRepository';
import { animationController } from './controllers/AnimationController';
import { playSoftChime } from './utils/chime';
import { t } from './i18n/translations';
import { BUILDINGS } from './three/campusData';
import { ValleyBackground } from './components/glass/ValleyBackground';
import { CampusCanvas } from './components/scene/CampusCanvas';
import { BottomDock } from './components/glass/BottomDock';
import { GlassToast, type ToastMessage } from './components/glass/GlassToast';
import { TicketDetailModal } from './components/glass/TicketDetailModal';
import { ResidentViews } from './components/views/ResidentViews';
import { WardenViews } from './components/views/WardenViews';
import { StaffViews } from './components/views/StaffViews';
import { SettingsSheet } from './components/modals/SettingsSheet';
import { ExplainerTour } from './components/modals/ExplainerTour';
import { JourneyReplayPanel } from './components/modals/JourneyReplayPanel';
import { LandingLoginGate } from './components/modals/LandingLoginGate';

export function App() {
  const [store, setStore] = useState<StoreSnapshot>(() => ticketRepository.load());
  const [role, setRole] = useState<UserRole>('resident');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [landingExploring3D, setLandingExploring3D] = useState<boolean>(false);
  const [activeSegment, setActiveSegment] = useState<string>('home');
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingId | null>(null);
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const [offlineSimulated, setOfflineSimulated] = useState<boolean>(false);
  const [typingActive, setTypingActive] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [orbJourney, setOrbJourney] = useState<OrbJourneyState | null>(null);
  const [reducedMotionPref, setReducedMotionPref] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  // Persist store changes
  useEffect(() => {
    ticketRepository.save(store);
  }, [store]);

  // Apply root theme, text-size, high-contrast & reduced-transparency attributes
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', store.settings.theme);
    el.setAttribute('data-text-size', store.settings.textSize);
    el.setAttribute('data-high-contrast', String(store.settings.highContrast));
    el.setAttribute('data-reduced-transparency', String(store.settings.reducedTransparency));
  }, [store.settings]);

  // Listen to OS reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotionPref(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Subscribe to central AnimationController
  useEffect(() => {
    return animationController.subscribe((journey) => {
      setOrbJourney(journey);
    });
  }, []);

  // Emit initial orb state from the first active ticket
  useEffect(() => {
    const first = store.tickets[0];
    if (first && !animationController.getCurrent()) {
      animationController.emitTicketJourney(first, isTicketOverdue(first));
    }
  }, [store.tickets]);

  const pushToast = useCallback((title: string, detail?: string, kind: ToastMessage['kind'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, detail, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4400);
  }, []);

  const loggedInUser = useMemo(
    () => (activeUserId ? store.users.find((u) => u.id === activeUserId) ?? null : null),
    [store.users, activeUserId]
  );

  const currentUser = loggedInUser ?? store.users[0];

  const overdueCount = useMemo(
    () => store.tickets.filter((tk) => isTicketOverdue(tk)).length,
    [store.tickets]
  );

  const unreadAlertsCount = useMemo(() => {
    if (!loggedInUser) return 0;
    return store.notifications.filter((n) => !n.readAt && (role === 'warden' || n.userId === loggedInUser.id)).length;
  }, [store.notifications, role, loggedInUser]);

  // Role-aware Bottom Dock segments (max 5)
  const dockSegments: DockSegment[] = useMemo(() => {
    if (role === 'resident') {
      return [
        { id: 'home', labelKey: 'nav.home', building: 'hostel_block' },
        { id: 'new_ticket', labelKey: 'nav.newTicket', building: 'hostel_block' },
        { id: 'my_tickets', labelKey: 'nav.myTickets', building: 'notice_board' },
        { id: 'alerts', labelKey: 'nav.alerts', building: 'clock_tower', badge: unreadAlertsCount },
        { id: 'profile', labelKey: 'nav.profile', building: 'main_gate' },
      ];
    }
    if (role === 'warden') {
      return [
        { id: 'overview', labelKey: 'nav.overview', building: 'wardens_office', badge: overdueCount },
        { id: 'tickets', labelKey: 'nav.tickets', building: 'notice_board' },
        { id: 'staff', labelKey: 'nav.staff', building: 'workshop' },
        { id: 'reports', labelKey: 'nav.reports', building: 'clock_tower' },
        { id: 'settings', labelKey: 'nav.settings', building: 'main_gate' },
      ];
    }
    return [
      { id: 'my_jobs', labelKey: 'nav.myJobs', building: 'workshop', badge: store.tickets.filter((tk) => tk.assignedTo === currentUser.id && tk.status !== 'Resolved' && tk.status !== 'Closed').length },
      { id: 'updates', labelKey: 'nav.updates', building: 'utility_yard' },
      { id: 'history', labelKey: 'nav.history', building: 'feedback_gazebo' },
    ];
  }, [role, unreadAlertsCount, overdueCount, store.tickets, currentUser.id]);

  const handleSelectSegment = useCallback((seg: DockSegment) => {
    if (seg.id === 'settings') {
      setSettingsOpen(true);
      return;
    }
    setActiveSegment(seg.id);
    setActiveBuilding(seg.building);
    setPanelOpen(true);
  }, []);

  const handleLoginExisting = useCallback(
    (user: User) => {
      setRole(user.role);
      setActiveUserId(user.id);
      setLandingExploring3D(false);
      setTourOpen(false);
      if (user.role === 'resident') {
        setActiveSegment('home');
        setActiveBuilding('hostel_block');
      } else if (user.role === 'warden') {
        setActiveSegment('overview');
        setActiveBuilding('wardens_office');
      } else {
        setActiveSegment('my_jobs');
        setActiveBuilding('workshop');
      }
      setPanelOpen(true);
      pushToast(`Signed in as ${user.name}`, t(store.settings.language, `role.${user.role}`), 'success');
    },
    [store.settings.language, pushToast]
  );

  const handleLoginCustomStudent = useCallback(
    (payload: { name: string; block: HostelBlock; room: string }) => {
      const existing = store.users.find(
        (u) =>
          u.role === 'resident' &&
          u.name.toLowerCase() === payload.name.toLowerCase() &&
          u.room?.toLowerCase() === payload.room.toLowerCase()
      );
      if (existing) {
        handleLoginExisting(existing);
        return;
      }
      const initials = payload.name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'ST';
      const newUser: User = {
        id: `res-${Date.now().toString(36)}`,
        name: payload.name,
        role: 'resident',
        block: payload.block,
        room: payload.room,
        avatarInitials: initials,
      };
      setStore((prev) => ({ ...prev, users: [...prev.users, newUser] }));
      handleLoginExisting(newUser);
    },
    [store.users, handleLoginExisting]
  );

  const handleLogout = useCallback(() => {
    setActiveUserId(null);
    setSelectedTicketId(null);
    setActiveBuilding(null);
    setLandingExploring3D(false);
    setPanelOpen(true);
    pushToast('Signed out', 'Returned to 3D Main Gate');
  }, [pushToast]);

  const handleSwitchRole = useCallback((nextRole: UserRole, userId?: string) => {
    if (!userId && loggedInUser && nextRole === loggedInUser.role) {
      handleLogout();
      return;
    }
    const matched = userId
      ? store.users.find((u) => u.id === userId)
      : store.users.find((u) => u.role === nextRole);
    if (matched) handleLoginExisting(matched);
  }, [store.users, loggedInUser, handleLoginExisting, handleLogout]);

  const handleSelect3DBuilding = useCallback((id: BuildingId) => {
    setActiveBuilding(id);
    if (!loggedInUser) {
      setLandingExploring3D(false);
      pushToast(BUILDINGS[id].name, `${BUILDINGS[id].subtitle} — sign in to open`);
      return;
    }
    setPanelOpen(true);
    if (id === 'hostel_block') {
      if (role === 'resident') setActiveSegment('new_ticket');
    } else if (id === 'notice_board') {
      setActiveSegment(role === 'resident' ? 'my_tickets' : role === 'warden' ? 'tickets' : 'my_jobs');
    } else if (id === 'wardens_office') {
      if (role === 'warden') setActiveSegment('overview');
      else pushToast("Warden's Office", 'Sign in as Warden to access dashboard');
    } else if (id === 'workshop') {
      if (role === 'staff') setActiveSegment('my_jobs');
      else if (role === 'warden') setActiveSegment('staff');
      else pushToast('Maintenance Workshop', 'Sign in as Staff to manage repair queue');
    } else if (id === 'utility_yard') {
      if (role === 'staff') setActiveSegment('updates');
    } else if (id === 'clock_tower') {
      if (role === 'warden') setActiveSegment('reports');
      else setActiveSegment(role === 'resident' ? 'alerts' : 'my_jobs');
    } else if (id === 'feedback_gazebo') {
      setActiveSegment(role === 'resident' ? 'my_tickets' : role === 'staff' ? 'history' : 'overview');
    } else if (id === 'main_gate') {
      setActiveSegment(role === 'resident' ? 'profile' : role === 'warden' ? 'reports' : 'my_jobs');
    }
  }, [loggedInUser, role, pushToast]);

  const addNotification = (prev: StoreSnapshot, notif: Omit<AppNotification, 'id' | 'timestamp' | 'readAt'>): AppNotification[] => {
    return [
      {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: new Date().toISOString(),
        readAt: null,
      },
      ...prev.notifications,
    ];
  };

  // --- TICKET ACTIONS ---
  const handleSubmitTicket = (payload: {
    room: string;
    block: HostelBlock;
    category: TicketCategory;
    priority: TicketPriority;
    description: string;
    photos: string[];
  }): Ticket => {
    const id = nextTicketId(store.tickets);
    const createdAt = new Date().toISOString();
    const ticket: Ticket = {
      id,
      room: payload.room.trim(),
      block: payload.block,
      category: payload.category,
      priority: payload.priority,
      description: payload.description.trim() || `${payload.category} issue reported in ${payload.room}`,
      photos: payload.photos,
      status: 'Open',
      createdAt,
      dueAt: computeDueAt(createdAt, payload.priority, store.settings.slaHours),
      assignedTo: null,
      residentId: currentUser.id,
      rating: null,
      reopenCount: 0,
      offlineQueued: offlineSimulated,
    };

    const ev = makeTimelineEntry({
      ticketId: id,
      actor: currentUser,
      status: 'Open',
      note: ticket.description,
      photo: payload.photos[0],
    });

    setStore((prev) => ({
      ...prev,
      tickets: [ticket, ...prev.tickets],
      timeline: [...prev.timeline, ev],
      notifications: addNotification(prev, {
        userId: 'war-kavita',
        ticketId: id,
        type: 'submitted',
        title: `New ${payload.priority} ${payload.category} ticket (${id})`,
        body: `Room ${ticket.room} (${ticket.block}): ${ticket.description}`,
      }),
    }));

    animationController.emitTicketJourney(ticket, false);
    pushToast(
      offlineSimulated ? `${id} queued offline` : `${id} launched!`,
      `Room ${ticket.room} window lit amber`,
      'success'
    );
    return ticket;
  };

  const handleAssignTicket = (ticketId: string, staffId: string) => {
    const staffUser = store.users.find((u) => u.id === staffId);
    if (!staffUser) return;
    let updatedTicket: Ticket | null = null;

    setStore((prev) => {
      const nextTickets = prev.tickets.map((tk) => {
        if (tk.id !== ticketId) return tk;
        updatedTicket = { ...tk, assignedTo: staffId, status: 'Assigned' };
        return updatedTicket;
      });
      const ev = makeTimelineEntry({
        ticketId,
        actor: currentUser,
        status: 'Assigned',
        note: `Assigned to ${staffUser.name} (${staffUser.skills?.join(', ')}).`,
      });
      return {
        ...prev,
        tickets: nextTickets,
        timeline: [...prev.timeline, ev],
        notifications: addNotification(prev, {
          userId: updatedTicket?.residentId ?? 'res-aarav',
          ticketId,
          type: 'assigned',
          title: `${ticketId} assigned to ${staffUser.name}`,
          body: 'Maintenance staff has received your complaint orb.',
        }),
      };
    });

    if (updatedTicket) {
      animationController.emitTicketJourney(updatedTicket, isTicketOverdue(updatedTicket));
      setActiveBuilding('wardens_office');
    }
    pushToast(`Assigned ${ticketId}`, `Sent to ${staffUser.name}`, 'success');
  };

  const handleBulkAssign = (ticketIds: string[], staffId: string) => {
    ticketIds.forEach((id) => handleAssignTicket(id, staffId));
  };

  const handlePostStatusUpdate = (ticketId: string, status: TicketStatus, note: string, photo?: string) => {
    let updatedTicket: Ticket | null = null;
    setStore((prev) => {
      const nextTickets = prev.tickets.map((tk) => {
        if (tk.id !== ticketId) return tk;
        updatedTicket = { ...tk, status };
        return updatedTicket;
      });
      const ev = makeTimelineEntry({
        ticketId,
        actor: currentUser,
        status,
        note,
        photo,
      });
      return {
        ...prev,
        tickets: nextTickets,
        timeline: [...prev.timeline, ev],
        notifications: addNotification(prev, {
          userId: updatedTicket?.residentId ?? 'res-aarav',
          ticketId,
          type: status === 'Resolved' ? 'resolved' : status === 'Waiting for parts' ? 'waiting_parts' : 'in_progress',
          title: `${ticketId} is now ${status}`,
          body: note,
        }),
      };
    });

    if (updatedTicket) {
      animationController.emitTicketJourney(updatedTicket, isTicketOverdue(updatedTicket));
      if (status === 'Resolved') playSoftChime('resolved', store.settings.soundEnabled);
      setActiveBuilding(
        status === 'Waiting for parts' ? 'utility_yard' : status === 'Resolved' ? 'hostel_block' : 'workshop'
      );
    }
    pushToast(`${ticketId} updated to ${status}`, note, 'success');
  };

  const handleConfirmAndRate = (ticket: Ticket, rating: number, comment: string) => {
    const updated: Ticket = { ...ticket, status: 'Closed', rating, ratingComment: comment };
    setStore((prev) => ({
      ...prev,
      tickets: prev.tickets.map((tk) => (tk.id === ticket.id ? updated : tk)),
      timeline: [
        ...prev.timeline,
        makeTimelineEntry({
          ticketId: ticket.id,
          actor: currentUser,
          status: 'Closed',
          note: `Confirmed resolved and rated ${rating}/5 stars.${comment ? ` “${comment}”` : ''}`,
        }),
      ],
    }));
    animationController.emitTicketJourney(updated, false);
    setActiveBuilding('feedback_gazebo');
    setSelectedTicketId(null);
    pushToast(`Thank you! ${ticket.id} closed`, `Rated ${rating}/5 stars at Feedback Gazebo`, 'success');
  };

  const handleReopenTicket = (ticket: Ticket, reason: string, photo?: string) => {
    const updated: Ticket = {
      ...ticket,
      status: 'Reopened',
      reopenCount: ticket.reopenCount + 1,
    };
    setStore((prev) => ({
      ...prev,
      tickets: prev.tickets.map((tk) => (tk.id === ticket.id ? updated : tk)),
      timeline: [
        ...prev.timeline,
        makeTimelineEntry({
          ticketId: ticket.id,
          actor: currentUser,
          status: 'Reopened',
          note: reason,
          photo,
        }),
      ],
      notifications: addNotification(prev, {
        userId: 'war-kavita',
        ticketId: ticket.id,
        type: 'reopened',
        title: `${ticket.id} reopened by resident`,
        body: reason,
      }),
    }));
    animationController.emitTicketJourney(updated, isTicketOverdue(updated));
    setActiveBuilding('wardens_office');
    pushToast(`${ticket.id} reopened`, "Returned to Warden's Office", 'warning');
  };

  const handleNudgeWarden = (ticket: Ticket) => {
    const nowIso = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      tickets: prev.tickets.map((tk) => (tk.id === ticket.id ? { ...tk, nudgedAt: nowIso } : tk)),
      notifications: addNotification(prev, {
        userId: 'war-kavita',
        ticketId: ticket.id,
        type: 'nudged',
        title: `Resident nudged on overdue ${ticket.id}`,
        body: `Room ${ticket.room} is waiting for action.`,
      }),
    }));
    playSoftChime('overdue', store.settings.soundEnabled);
    pushToast('Warden nudged', `${ticket.id} highlighted at Clock Tower`, 'warning');
  };

  const handleTrackTicket = (ticket: Ticket, scrubProgress?: number) => {
    const overdue = isTicketOverdue(ticket);
    animationController.emitTicketJourney(ticket, overdue, scrubProgress);
    const targetBuilding: BuildingId =
      overdue
        ? 'clock_tower'
        : ticket.status === 'Assigned'
          ? 'wardens_office'
          : ticket.status === 'In progress'
            ? 'workshop'
            : ticket.status === 'Waiting for parts'
              ? 'utility_yard'
              : ticket.status === 'Closed'
                ? 'feedback_gazebo'
                : 'hostel_block';
    setActiveBuilding(targetBuilding);
    if (typeof scrubProgress !== 'number') {
      setPanelOpen(false); // Let user watch the 3D TicketOrb glide unobstructed
      pushToast(`Tracking ${ticket.id}`, `Orb at ${BUILDINGS[targetBuilding].name}`);
    }
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setStore((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const handleUpdateSla = (slaHours: SlaHoursConfig) => {
    setStore((prev) => ({ ...prev, settings: { ...prev.settings, slaHours } }));
    pushToast('SLA thresholds updated', `Urgent ${slaHours.Urgent}h · High ${slaHours.High}h`);
  };

  const handleToggleOffline = () => {
    const nextOffline = !offlineSimulated;
    setOfflineSimulated(nextOffline);
    if (!nextOffline) {
      // Sync queued offline tickets
      setStore((prev) => ({
        ...prev,
        tickets: prev.tickets.map((tk) => ({ ...tk, offlineQueued: false })),
      }));
      pushToast('Back online', 'Queued complaints synced to campus server', 'success');
    } else {
      pushToast('Offline mode enabled', 'New drafts will queue locally', 'warning');
    }
  };

  const selectedTicket = useMemo(
    () => store.tickets.find((tk) => tk.id === selectedTicketId) ?? null,
    [store.tickets, selectedTicketId]
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 1. Background + Adaptive Scrim + Fallback Wallpapers */}
      <ValleyBackground
        theme={store.settings.theme}
        panelOpen={panelOpen}
        is2DMode={store.settings.force2DMode}
      />

      {/* 2. 3D Hostel Quarter Scene (3dviz-pro-max) */}
      <CampusCanvas
        theme={store.settings.theme}
        force2DMode={store.settings.force2DMode}
        reducedMotion={reducedMotionPref}
        activeBuilding={activeBuilding}
        tickets={store.tickets}
        orbJourney={orbJourney}
        onSelectBuilding={handleSelect3DBuilding}
        onHoverBuilding={setHoveredBuilding}
        onWebGLUnavailable={() => handleUpdateSettings({ force2DMode: true })}
      />

      {/* 3. Non-overlapping Flex Shell: Floating Top Pills + Scrollable Main Panel */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        <header className="shrink-0 pt-3 px-3 sm:px-4 flex flex-wrap items-start justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <div className="glass-lens-pill glass-lens-specular px-3.5 py-1.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-amber)] shadow-[0_0_10px_var(--accent-amber-glow)]" />
              <div>
                <span className="font-display text-sm font-bold text-[var(--text-primary)]">
                  {t(store.settings.language, 'appTitle')}
                </span>
                <span className="hidden sm:inline text-xs text-[var(--text-muted)] ml-2">
                  {t(store.settings.language, 'quarterTitle')}
                </span>
              </div>
            </div>

            {/* Signed-in User Badge + Logout OR Guest Landing Badge */}
            {loggedInUser ? (
              <div className="glass-lens-pill p-1 pl-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {loggedInUser.name}
                  {loggedInUser.room ? ` · ${loggedInUser.room}` : ''}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out to Main Gate"
                  className="px-2.5 py-1 rounded-full bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] hover:bg-[var(--accent-amber)] hover:text-slate-950 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="glass-lens-pill px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                Main Gate · Sign in to continue
              </div>
            )}

            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => handleSelect3DBuilding('clock_tower')}
                className="glass-lens-pill px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-amber)] cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overdueCount} Overdue</span>
              </button>
            )}
          </div>

          {/* Hovered Building Tooltip + Orb Stages + Explore/Settings Controls */}
          <div className="pointer-events-auto flex items-start gap-2 ml-auto">
            {hoveredBuilding && (
              <div className="glass-lens-pill px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hidden sm:flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>{BUILDINGS[hoveredBuilding].name}</span>
                <span className="text-[var(--text-muted)]">· {BUILDINGS[hoveredBuilding].subtitle}</span>
              </div>
            )}
            <JourneyReplayPanel
              activeStage={orbJourney?.stationIndex ?? 0}
              onReplayStage={(stageIndex, bld) => {
                if (loggedInUser) setPanelOpen(false);
                else setLandingExploring3D(true);
                animationController.emitStoryboardStage(stageIndex);
                setActiveBuilding(bld);
              }}
            />
            {loggedInUser ? (
              <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                aria-label={panelOpen ? 'Minimize panel to explore 3D campus' : 'Open active glass panel'}
                className="glass-lens-btn px-3.5 min-h-[40px] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                {panelOpen ? <Eye className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 rotate-180" />}
                <span className="hidden sm:inline">{panelOpen ? 'Explore 3D' : 'Open Panel'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open theme and accessibility settings"
                className="glass-lens-btn w-10 h-10 flex items-center justify-center cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[var(--text-primary)]" />
              </button>
            )}
          </div>
        </header>

        {/* Offline Banner */}
        {offlineSimulated && (
          <div className="mx-auto mt-2 glass-lens-pill px-4 py-1.5 flex items-center gap-2 text-xs text-[var(--accent-amber)] pointer-events-auto">
            <WifiOff className="w-4 h-4" />
            <span>{t(store.settings.language, 'offline.banner')}</span>
          </div>
        )}

        {/* 4. Either 3D Landing + Student/Warden Login Gate OR Logged-in Role Panel */}
        {!loggedInUser ? (
          <LandingLoginGate
            users={store.users}
            exploring3D={landingExploring3D}
            onToggleExplore3D={() => setLandingExploring3D((v) => !v)}
            onReplayTour={() => {
              setLandingExploring3D(true);
              setTourOpen(true);
            }}
            onLoginExisting={handleLoginExisting}
            onLoginCustomStudent={handleLoginCustomStudent}
          />
        ) : (
          <AnimatePresence>
            {panelOpen && (
              <motion.main
                key={`${role}-${activeSegment}`}
                initial={{ opacity: 0, y: 36, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 36, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="flex-1 min-h-0 pt-2.5 pb-22 px-3 sm:px-6 flex justify-center pointer-events-none"
              >
                <div className="w-full max-w-4xl h-full overflow-y-auto glass-scroll pointer-events-auto pb-4 pr-1 select-text">
                  {role === 'resident' && (
                    <ResidentViews
                      activeSegment={activeSegment}
                      user={currentUser}
                      users={store.users}
                      tickets={store.tickets}
                      notifications={store.notifications}
                      lang={store.settings.language}
                      is2DMode={store.settings.force2DMode}
                      onNavigate={(seg, bld) => {
                        setActiveSegment(seg);
                        setActiveBuilding(bld);
                      }}
                      onSubmitTicket={handleSubmitTicket}
                      onOpenTicket={(tk) => setSelectedTicketId(tk.id)}
                      onTrackTicket={(tk) => handleTrackTicket(tk)}
                      onMarkNotifRead={(id) =>
                        setStore((prev) => ({
                          ...prev,
                          notifications: prev.notifications.map((n) =>
                            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
                          ),
                        }))
                      }
                      onSwitchRole={handleSwitchRole}
                      onTypingChange={setTypingActive}
                    />
                  )}

                  {role === 'warden' && (
                    <WardenViews
                      activeSegment={activeSegment}
                      users={store.users}
                      tickets={store.tickets}
                      slaHours={store.settings.slaHours}
                      lang={store.settings.language}
                      onAssignTicket={handleAssignTicket}
                      onBulkAssign={handleBulkAssign}
                      onUpdateSla={handleUpdateSla}
                      onOpenTicket={(tk) => setSelectedTicketId(tk.id)}
                      onTrackTicket={(tk) => handleTrackTicket(tk)}
                      onSwitchRole={handleSwitchRole}
                    />
                  )}

                  {role === 'staff' && (
                    <StaffViews
                      activeSegment={activeSegment}
                      staff={currentUser}
                      tickets={store.tickets}
                      lang={store.settings.language}
                      onPostStatusUpdate={handlePostStatusUpdate}
                      onOpenTicket={(tk) => setSelectedTicketId(tk.id)}
                      onTrackTicket={(tk) => handleTrackTicket(tk)}
                      onSwitchRole={handleSwitchRole}
                    />
                  )}
                </div>
              </motion.main>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Live Orb Journey Caption Pill when exploring 3D */}
      {((loggedInUser && !panelOpen) || (!loggedInUser && landingExploring3D)) && orbJourney && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 glass-lens-pill px-4 py-2 text-xs text-[var(--text-primary)] max-w-[90vw] truncate">
          <span className="font-mono-code font-bold text-[var(--accent-amber)] mr-2">
            {orbJourney.ticketId}
          </span>
          <span>{orbJourney.caption}</span>
        </div>
      )}

      {/* 5. Role-Aware Bottom Toggle Dock (shown once signed in) */}
      {loggedInUser && (
        <BottomDock
          role={role}
          segments={dockSegments}
          activeSegment={activeSegment}
          onSelect={handleSelectSegment}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={store.settings.theme}
          onToggleTheme={() =>
            handleUpdateSettings({
              theme: store.settings.theme === 'obsidian' ? 'frost' : 'obsidian',
            })
          }
          lang={store.settings.language}
          typingActive={typingActive}
        />
      )}

      {/* 6. Modals, Toasts, Explainer Tour & Stage Replay */}
      <GlassToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        events={store.timeline}
        staffList={store.users.filter((u) => u.role === 'staff')}
        currentRole={role}
        lang={store.settings.language}
        is2DMode={store.settings.force2DMode}
        onClose={() => setSelectedTicketId(null)}
        onTrack={handleTrackTicket}
        onNudgeWarden={handleNudgeWarden}
        onConfirmAndRate={handleConfirmAndRate}
        onReopenTicket={handleReopenTicket}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={store.settings}
        offlineSimulated={offlineSimulated}
        onUpdateSettings={handleUpdateSettings}
        onToggleOffline={handleToggleOffline}
        onReplayTour={() => {
          if (loggedInUser) setPanelOpen(false);
          else setLandingExploring3D(true);
          setTourOpen(true);
        }}
        onResetDemo={() => {
          const fresh = ticketRepository.reset();
          setStore(fresh);
          pushToast('Demo data restored', 'All sample tickets & timeline reset');
        }}
      />

      <ExplainerTour
        open={tourOpen}
        reducedMotion={reducedMotionPref}
        onStepChange={(stageIndex, bld) => {
          animationController.emitStoryboardStage(stageIndex);
          setActiveBuilding(bld);
        }}
        onClose={() => {
          setTourOpen(false);
          setStore((prev) => ({ ...prev, tourCompleted: true }));
        }}
      />
    </div>
  );
}

export default App;
