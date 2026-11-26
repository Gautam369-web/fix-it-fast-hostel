import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardList,
  History,
  Home,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Ticket,
  UserCircle,
  Users,
  Wrench,
} from 'lucide-react';
import type { DockSegment, LanguageCode, ThemeMode, UserRole } from '../../types/domain';
import { t } from '../../i18n/translations';

export interface BottomDockProps {
  role: UserRole;
  segments: DockSegment[];
  activeSegment: string;
  onSelect: (segment: DockSegment) => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  lang: LanguageCode;
  typingActive?: boolean;
}

function iconForSegment(id: string) {
  switch (id) {
    case 'home':
      return <Home className="w-5 h-5" />;
    case 'new_ticket':
      return <PlusCircle className="w-5 h-5" />;
    case 'my_tickets':
    case 'tickets':
      return <Ticket className="w-5 h-5" />;
    case 'alerts':
      return <Bell className="w-5 h-5" />;
    case 'profile':
      return <UserCircle className="w-5 h-5" />;
    case 'overview':
      return <LayoutDashboard className="w-5 h-5" />;
    case 'staff':
      return <Users className="w-5 h-5" />;
    case 'reports':
      return <BarChart3 className="w-5 h-5" />;
    case 'settings':
      return <Settings className="w-5 h-5" />;
    case 'my_jobs':
      return <ClipboardList className="w-5 h-5" />;
    case 'updates':
      return <Wrench className="w-5 h-5" />;
    case 'history':
      return <History className="w-5 h-5" />;
    default:
      return <AlertTriangle className="w-5 h-5" />;
  }
}

export const BottomDock: React.FC<BottomDockProps> = ({
  segments,
  activeSegment,
  onSelect,
  onOpenSettings,
  theme,
  onToggleTheme,
  lang,
  typingActive = false,
}) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [stretching, setStretching] = useState(false);

  const handleSelect = (seg: DockSegment) => {
    if (seg.id !== activeSegment) {
      setStretching(true);
      window.setTimeout(() => setStretching(false), 380);
    }
    onSelect(seg);
  };

  useEffect(() => {
    setStretching(false);
  }, [segments.length]);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % segments.length;
      tabRefs.current[next]?.focus();
      handleSelect(segments[next]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + segments.length) % segments.length;
      tabRefs.current[prev]?.focus();
      handleSelect(segments[prev]);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 max-w-[96vw] pb-[env(safe-area-inset-bottom)]"
    >
      <motion.nav
        aria-label="Primary campus dock"
        animate={{
          scale: typingActive ? 0.88 : 1,
          y: typingActive ? 10 : 0,
          opacity: typingActive ? 0.72 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="glass-lens-pill glass-lens-specular p-1.5 flex items-center gap-1"
      >
        <div role="tablist" aria-label="Workspace views" className="flex items-center gap-1">
          {segments.map((seg, idx) => {
            const active = seg.id === activeSegment;
            const label = t(lang, seg.labelKey);
            return (
              <button
                key={seg.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                tabIndex={active ? 0 : -1}
                onClick={() => handleSelect(seg)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative min-h-[44px] min-w-[44px] px-3 sm:px-4 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                  active
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dock-liquid-thumb"
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    animate={{
                      scaleX: stretching ? 1.14 : 1,
                      scaleY: stretching ? 0.92 : 1,
                    }}
                    className="absolute inset-0 rounded-full border border-[var(--dock-thumb-border)] bg-[var(--dock-thumb-bg)] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.55),0_4px_14px_rgba(0,0,0,0.22)]"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {iconForSegment(seg.id)}
                  <span className="hidden md:inline whitespace-nowrap">{label}</span>
                </span>
                {typeof seg.badge === 'number' && seg.badge > 0 && (
                  <motion.span
                    key={seg.badge}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="relative z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent-amber)] text-slate-950 text-[10px] font-bold flex items-center justify-center"
                  >
                    {seg.badge}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </motion.nav>

      {/* Uiverse-inspired Round Glass Settings & Theme Trigger */}
      <motion.button
        type="button"
        onClick={onOpenSettings}
        whileTap={{ scale: 0.95 }}
        aria-label="Open theme, accessibility and language settings"
        title="Settings & Theme"
        className="glass-lens-btn w-[52px] h-[52px] flex items-center justify-center shrink-0 cursor-pointer"
      >
        <Settings className="w-5 h-5 text-[var(--text-primary)]" aria-hidden="true" />
      </motion.button>

      {/* Quick Frost / Obsidian Capsule Toggle beside dock on wider viewports */}
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'obsidian' ? 'Frost' : 'Obsidian'} theme`}
        title={`Theme: ${theme === 'obsidian' ? 'Obsidian' : 'Frost'}`}
        className="hidden sm:flex uiverse-glass-toggle items-center shrink-0"
      >
        <span
          className="uiverse-glass-toggle-thumb"
          style={{
            transform: theme === 'frost' ? 'translateX(28px)' : 'translateX(0px)',
          }}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              theme === 'frost' ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          />
        </span>
      </button>
    </div>
  );
};
