import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { COMPLAINT_STORYBOARD } from '../../controllers/AnimationController';
import type { BuildingId } from '../../types/domain';

export const JourneyReplayPanel: React.FC<{
  activeStage: number;
  onReplayStage: (stageIndex: number, building: BuildingId) => void;
}> = ({ activeStage, onReplayStage }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="glass-lens-btn px-3.5 min-h-[40px] flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
        <span>Orb Stages</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="glass-lens-panel glass-lens-specular absolute right-0 top-full mt-2 w-60 p-2.5 z-50 space-y-1">
          {COMPLAINT_STORYBOARD.map((st) => (
            <button
              key={st.index}
              type="button"
              onClick={() => {
                setOpen(false);
                onReplayStage(st.index, st.toBuilding);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer ${
                activeStage === st.index
                  ? 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
