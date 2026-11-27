import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  GraduationCap,
  KeyRound,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { HostelBlock, User, UserRole } from '../../types/domain';
import { GlassButton } from '../glass/GlassButton';
import { GlassChip } from '../glass/GlassChip';
import { GlassInput } from '../glass/GlassInput';

export interface LandingLoginGateProps {
  users: User[];
  exploring3D: boolean;
  onToggleExplore3D: () => void;
  onReplayTour: () => void;
  onLoginExisting: (user: User) => void;
  onLoginCustomStudent: (payload: { name: string; block: HostelBlock; room: string }) => void;
}

export const LandingLoginGate: React.FC<LandingLoginGateProps> = ({
  users,
  exploring3D,
  onToggleExplore3D,
  onReplayTour,
  onLoginExisting,
  onLoginCustomStudent,
}) => {
  const [selectedTab, setSelectedTab] = useState<UserRole>('resident');
  const [studentMode, setStudentMode] = useState<'demo' | 'custom'>('demo');
  const [customName, setCustomName] = useState('');
  const [customBlock, setCustomBlock] = useState<HostelBlock>('Block A');
  const [customRoom, setCustomRoom] = useState('');
  const [wardenPin, setWardenPin] = useState('1234');
  const [pinError, setPinError] = useState('');

  const residents = users.filter((u) => u.role === 'resident');
  const wardens = users.filter((u) => u.role === 'warden');
  const staffMembers = users.filter((u) => u.role === 'staff');

  const [chosenUserId, setChosenUserId] = useState<string>(residents[0]?.id ?? '');

  const handleTabSwitch = (nextRole: UserRole) => {
    setSelectedTab(nextRole);
    setPinError('');
    if (nextRole === 'resident') setChosenUserId(residents[0]?.id ?? '');
    else if (nextRole === 'warden') setChosenUserId(wardens[0]?.id ?? '');
    else setChosenUserId(staffMembers[0]?.id ?? '');
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTab === 'resident' && studentMode === 'custom') {
      if (!customName.trim() || !customRoom.trim()) return;
      onLoginCustomStudent({
        name: customName.trim(),
        block: customBlock,
        room: customRoom.trim().toUpperCase(),
      });
      return;
    }

    if (selectedTab === 'warden' && wardenPin.trim() !== '1234') {
      setPinError('Demo Warden PIN is 1234');
      return;
    }

    const user = users.find((u) => u.id === chosenUserId);
    if (user) onLoginExisting(user);
  };

  if (exploring3D) {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <GlassButton variant="amber" size="lg" onClick={onToggleExplore3D} icon={<KeyRound className="w-4 h-4" />}>
          Open Student / Warden Login
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-3 sm:px-6 pb-20 pt-2 overflow-y-auto glass-scroll">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 24 }}
        className="w-full max-w-2xl pointer-events-auto my-auto"
      >
        <div className="glass-lens-panel glass-lens-specular p-5 sm:p-7 space-y-5">
          {/* Hero Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-amber-soft)] border border-[var(--accent-amber)]/35 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D Hostel Quarter · Main Gate</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                Fix It Fast
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md">
                Explore the live 3D twilight hostel campus, then sign in as a Student, Warden, or Staff member to view your complaints and progress.
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <GlassButton size="sm" icon={<Compass className="w-4 h-4" />} onClick={onToggleExplore3D}>
                Explore 3D
              </GlassButton>
              <GlassButton size="sm" variant="ghost" icon={<PlayCircle className="w-4 h-4" />} onClick={onReplayTour}>
                How it works
              </GlassButton>
            </div>
          </div>

          {/* Role Login Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Login role selection">
            <GlassChip
              label="Student Login"
              sublabel="File & track fixes"
              icon={<GraduationCap className="w-4 h-4" />}
              selected={selectedTab === 'resident'}
              onClick={() => handleTabSwitch('resident')}
              className="!p-3"
            />
            <GlassChip
              label="Warden Login"
              sublabel="Assign & SLA"
              icon={<ShieldCheck className="w-4 h-4" />}
              selected={selectedTab === 'warden'}
              onClick={() => handleTabSwitch('warden')}
              className="!p-3"
            />
            <GlassChip
              label="Staff Login"
              sublabel="Repair queue"
              icon={<Wrench className="w-4 h-4" />}
              selected={selectedTab === 'staff'}
              onClick={() => handleTabSwitch('staff')}
              className="!p-3"
            />
          </div>

          {/* Login Form Body */}
          <form onSubmit={handleSubmitLogin} className="glass-lens-card p-4 sm:p-5 space-y-4">
            {selectedTab === 'resident' && (
              <>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Student Portal Access
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStudentMode('demo')}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        studentMode === 'demo'
                          ? 'bg-[var(--accent-amber)] text-slate-950 font-semibold'
                          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)]'
                      }`}
                    >
                      Quick Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentMode('custom')}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        studentMode === 'custom'
                          ? 'bg-[var(--accent-amber)] text-slate-950 font-semibold'
                          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)]'
                      }`}
                    >
                      New Room Check-in
                    </button>
                  </div>
                </div>

                {studentMode === 'demo' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {residents.map((st) => (
                      <GlassChip
                        key={st.id}
                        large
                        label={st.name}
                        sublabel={`${st.block} · Room ${st.room}`}
                        selected={chosenUserId === st.id}
                        onClick={() => setChosenUserId(st.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <GlassInput
                        label="Student Name"
                        placeholder="e.g. Rohan Sharma"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                      <GlassInput
                        label="Room Number"
                        placeholder="e.g. C-305"
                        value={customRoom}
                        onChange={(e) => setCustomRoom(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Block A', 'Block B', 'Block C'] as HostelBlock[]).map((b) => (
                        <GlassChip
                          key={b}
                          label={b}
                          selected={customBlock === b}
                          onClick={() => setCustomBlock(b)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedTab === 'warden' && (
              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Warden Administration Access
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {wardens.map((w) => (
                    <GlassChip
                      key={w.id}
                      large
                      label={w.name}
                      sublabel="Full campus overview, SLA rules & staff assignment"
                      selected={chosenUserId === w.id}
                      onClick={() => setChosenUserId(w.id)}
                    />
                  ))}
                </div>
                <GlassInput
                  label="Warden PIN (Demo: 1234)"
                  type="password"
                  value={wardenPin}
                  onChange={(e) => {
                    setWardenPin(e.target.value);
                    setPinError('');
                  }}
                  hint={pinError || 'Enter 1234 to access Warden Dashboard'}
                />
              </div>
            )}

            {selectedTab === 'staff' && (
              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Maintenance Technician Sign-In
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {staffMembers.map((st) => (
                    <GlassChip
                      key={st.id}
                      large
                      label={st.name}
                      sublabel={st.skills?.join(' · ')}
                      selected={chosenUserId === st.id}
                      onClick={() => setChosenUserId(st.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <span className="text-xs text-[var(--text-muted)]">
                {selectedTab === 'resident'
                  ? 'Shows only your room & submitted complaints'
                  : selectedTab === 'warden'
                    ? 'Shows all blocks, overdue SLAs & analytics'
                    : 'Shows only jobs assigned to you'}
              </span>
              <GlassButton
                type="submit"
                variant="amber"
                size="lg"
                disabled={
                  selectedTab === 'resident' &&
                  studentMode === 'custom' &&
                  (!customName.trim() || !customRoom.trim())
                }
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {selectedTab === 'resident'
                  ? 'Sign in as Student'
                  : selectedTab === 'warden'
                    ? 'Sign in as Warden'
                    : 'Sign in as Staff'}
              </GlassButton>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
