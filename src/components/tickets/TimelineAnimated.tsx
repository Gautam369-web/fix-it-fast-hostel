import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Maximize2 } from 'lucide-react';
import type { LanguageCode, TimelineEvent } from '../../types/domain';
import { GlassModal } from '../glass/GlassModal';
import { StatusChip } from '../glass/StatusChip';

export const TimelineAnimated: React.FC<{
  events: TimelineEvent[];
  lang: LanguageCode;
  isLiveWorking?: boolean;
  scrubValue: number;
  onScrubChange: (progress: number) => void;
}> = ({ events, lang, isLiveWorking = false, scrubValue, onScrubChange }) => {
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Timeline scrub bar synchronized with the 3D TicketOrb */}
      <div className="glass-lens-card p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--text-secondary)]">
            Scrub Complaint Journey (syncs 3D orb)
          </span>
          <span className="font-mono-code text-[var(--accent-amber)]">
            {Math.round(scrubValue * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={scrubValue}
          aria-label="Scrub complaint timeline and 3D orb position"
          onChange={(e) => onScrubChange(Number(e.target.value))}
          className="w-full accent-[var(--accent-amber)] cursor-pointer"
        />
      </div>

      {/* Vertical drawing timeline */}
      <div className="relative pl-7 space-y-4">
        <svg
          className="pointer-events-none absolute left-2.5 top-2 bottom-2 w-1 h-[calc(100%-16px)]"
          viewBox="0 0 4 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.line
            x1="2"
            y1="0"
            x2="2"
            y2="100"
            stroke="var(--accent-amber)"
            strokeOpacity="0.45"
            strokeWidth="2.5"
            strokeDasharray="100"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        </svg>

        {events.map((ev, idx) => {
          const isLast = idx === events.length - 1;
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 260, damping: 24 }}
              className="relative"
            >
              {/* Node dot */}
              <span
                className={`absolute -left-[22px] top-3 w-3.5 h-3.5 rounded-full border-2 border-[var(--glass-border-top)] ${
                  isLast
                    ? 'bg-[var(--accent-amber)] shadow-[0_0_12px_var(--accent-amber-glow)]'
                    : 'bg-[var(--text-secondary)]'
                }`}
              />

              <div
                className={`glass-lens-card p-3.5 space-y-2 ${
                  isLast && isLiveWorking ? 'ring-1 ring-[var(--accent-amber)]/50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <StatusChip status={ev.status} lang={lang} />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{ev.actorName}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(ev.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{ev.note}</p>

                {isLast && isLiveWorking && (
                  <div className="uiverse-skeleton h-1.5 w-32 opacity-75" aria-label="Work in progress" />
                )}

                {ev.photo && (
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto(ev.photo!)}
                    className="group relative inline-block rounded-xl overflow-hidden border border-[var(--glass-border-side)] cursor-pointer"
                  >
                    <img
                      src={ev.photo}
                      alt="Timeline attachment"
                      className="h-20 w-28 object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 p-1 rounded-full bg-black/60 text-white">
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <GlassModal
        open={Boolean(lightboxPhoto)}
        onClose={() => setLightboxPhoto(null)}
        title="Attachment Preview"
      >
        {lightboxPhoto && (
          <img src={lightboxPhoto} alt="Full attachment" className="w-full rounded-2xl object-contain max-h-[65vh]" />
        )}
      </GlassModal>
    </div>
  );
};
