import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import type { BuildingId } from '../../types/domain';
import { GlassButton } from '../glass/GlassButton';

const TOUR_STEPS: Array<{
  stageIndex: number;
  building: BuildingId;
  title: string;
  caption: string;
}> = [
  {
    stageIndex: 0,
    building: 'hostel_block',
    title: 'You report',
    caption: 'Pick room, category & photo in under 60s. Your window lights amber.',
  },
  {
    stageIndex: 1,
    building: 'wardens_office',
    title: 'Warden assigns',
    caption: 'The glass orb flies to the Warden’s Office and connects to skilled staff.',
  },
  {
    stageIndex: 2,
    building: 'workshop',
    title: 'Staff fixes',
    caption: 'Staff post live updates & photos from their phone; the Clock Tower guards SLAs.',
  },
  {
    stageIndex: 5,
    building: 'feedback_gazebo',
    title: 'You confirm and rate',
    caption: 'Verify the fix, award stars at the Feedback Gazebo, and the window dims.',
  },
];

export const ExplainerTour: React.FC<{
  open: boolean;
  reducedMotion: boolean;
  onStepChange: (stageIndex: number, building: BuildingId) => void;
  onClose: () => void;
}> = ({ open, reducedMotion, onStepChange, onClose }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    onStepChange(TOUR_STEPS[0].stageIndex, TOUR_STEPS[0].building);
  }, [open]);

  useEffect(() => {
    if (!open || reducedMotion) return;
    const timer = window.setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= TOUR_STEPS.length) {
          onClose();
          return prev;
        }
        onStepChange(TOUR_STEPS[next].stageIndex, TOUR_STEPS[next].building);
        return next;
      });
    }, 4800);
    return () => window.clearInterval(timer);
  }, [open, reducedMotion, onClose, onStepChange]);

  const current = TOUR_STEPS[idx];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,520px)]"
        >
          <div className="glass-lens-panel glass-lens-specular p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
                <Sparkles className="w-4 h-4" />
                <span>How Fix It Fast Works · {idx + 1}/4</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Skip tour"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{current.title}</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">{current.caption}</p>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    aria-label={`Tour step ${i + 1}`}
                    onClick={() => {
                      setIdx(i);
                      onStepChange(s.stageIndex, s.building);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === idx ? 'w-7 bg-[var(--accent-amber)]' : 'w-2 bg-[var(--glass-border-side)]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <GlassButton size="sm" variant="ghost" onClick={onClose}>
                  Skip
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="amber"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (idx + 1 >= TOUR_STEPS.length) onClose();
                    else {
                      const next = idx + 1;
                      setIdx(next);
                      onStepChange(TOUR_STEPS[next].stageIndex, TOUR_STEPS[next].building);
                    }
                  }}
                >
                  {idx + 1 >= TOUR_STEPS.length ? 'Done' : 'Next'}
                </GlassButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
