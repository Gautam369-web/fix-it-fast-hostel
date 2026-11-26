import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  Clock,
  SlidersHorizontal,
  Star,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  HostelBlock,
  LanguageCode,
  SlaHoursConfig,
  Ticket,
  TicketCategory,
  TicketPriority,
  User,
  UserRole,
} from '../../types/domain';
import { isTicketOverdue } from '../../data/mockApi';
import { t } from '../../i18n/translations';
import { GlassButton } from '../glass/GlassButton';
import { GlassCard } from '../glass/GlassCard';
import { GlassChip } from '../glass/GlassChip';
import { PriorityChip, StatusChip } from '../glass/StatusChip';

export const WardenViews: React.FC<{
  activeSegment: string;
  users: User[];
  tickets: Ticket[];
  slaHours: SlaHoursConfig;
  lang: LanguageCode;
  onAssignTicket: (ticketId: string, staffId: string, customDueAt?: string) => void;
  onBulkAssign: (ticketIds: string[], staffId: string) => void;
  onUpdateSla: (sla: SlaHoursConfig) => void;
  onOpenTicket: (ticket: Ticket) => void;
  onTrackTicket: (ticket: Ticket) => void;
  onSwitchRole: (role: UserRole, userId?: string) => void;
}> = ({
  activeSegment,
  users,
  tickets,
  slaHours,
  lang,
  onAssignTicket,
  onBulkAssign,
  onUpdateSla,
  onOpenTicket,
  onTrackTicket,
  onSwitchRole,
}) => {
  const staffMembers = useMemo(() => users.filter((u) => u.role === 'staff'), [users]);
  const overdueTickets = useMemo(() => tickets.filter((tk) => isTicketOverdue(tk)), [tickets]);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStaffId, setBulkStaffId] = useState<string>(staffMembers[0]?.id ?? '');

  const stats = useMemo(() => {
    const pending = tickets.filter((tk) => tk.status === 'Open' || tk.status === 'Assigned' || tk.status === 'Reopened').length;
    const inProgress = tickets.filter((tk) => tk.status === 'In progress' || tk.status === 'Waiting for parts').length;
    const resolvedWeek = tickets.filter((tk) => tk.status === 'Resolved' || tk.status === 'Closed').length;
    const rated = tickets.filter((tk) => typeof tk.rating === 'number');
    const avgRating = rated.length
      ? (rated.reduce((s, tk) => s + (tk.rating ?? 0), 0) / rated.length).toFixed(1)
      : '4.8';
    return { pending, inProgress, overdue: overdueTickets.length, resolvedWeek, avgRating };
  }, [tickets, overdueTickets.length]);

  const categoryChartData = useMemo(() => {
    const cats: TicketCategory[] = ['Plumbing', 'Electrical', 'Cleaning', 'Other'];
    return cats.map((name) => ({
      name,
      count: tickets.filter((tk) => tk.category === name).length,
    }));
  }, [tickets]);

  const blockChartData = useMemo(() => {
    const blocks: HostelBlock[] = ['Block A', 'Block B', 'Block C'];
    return blocks.map((name) => ({
      name,
      count: tickets.filter((tk) => tk.block === name).length,
    }));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((tk) => {
        if (filterStatus !== 'ALL' && tk.status !== filterStatus) return false;
        if (filterBlock !== 'ALL' && tk.block !== filterBlock) return false;
        if (filterCategory !== 'ALL' && tk.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tickets, filterStatus, filterBlock, filterCategory]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // --- OVERVIEW ---
  if (activeSegment === 'overview') {
    return (
      <div className="space-y-4">
        {/* 6 Summary Glass Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <GlassCard className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Pending</p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.pending}</p>
          </GlassCard>
          <GlassCard className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">In Progress</p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.inProgress}</p>
          </GlassCard>
          <GlassCard overdue={stats.overdue > 0} className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--accent-amber)] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Overdue
            </p>
            <p className="font-display text-2xl font-bold text-[var(--accent-amber)] mt-1">{stats.overdue}</p>
          </GlassCard>
          <GlassCard className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Resolved</p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.resolvedWeek}</p>
          </GlassCard>
          <GlassCard className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Avg Resolution</p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">18h</p>
          </GlassCard>
          <GlassCard className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Avg Rating
            </p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.avgRating}</p>
          </GlassCard>
        </div>

        {/* Pinned Overdue Escalation List */}
        {overdueTickets.length > 0 && (
          <GlassCard overdue className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--accent-amber)] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Pinned Overdue Escalations ({overdueTickets.length})</span>
              </h2>
            </div>
            <div className="space-y-2">
              {overdueTickets.map((tk) => (
                <div
                  key={tk.id}
                  className="glass-lens-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-bold text-[var(--accent-amber)]">{tk.id}</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {tk.room} · {tk.category}
                      </span>
                      <PriorityChip priority={tk.priority} lang={lang} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{tk.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label={`Assign ${tk.id}`}
                      value={tk.assignedTo ?? ''}
                      onChange={(e) => e.target.value && onAssignTicket(tk.id, e.target.value)}
                      className="glass-lens-input px-3 py-1.5 text-xs min-h-[38px]"
                    >
                      <option value="">Assign staff...</option>
                      {staffMembers.map((st) => (
                        <option key={st.id} value={st.id} className="text-slate-900">
                          {st.name} ({st.skills?.join(', ')})
                        </option>
                      ))}
                    </select>
                    <GlassButton size="sm" variant="amber" onClick={() => onTrackTicket(tk)}>
                      Orb
                    </GlassButton>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Charts by Category and by Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GlassCard className="p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Tickets by Category
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-solid-fallback)',
                      border: '1px solid var(--glass-border-side)',
                      borderRadius: '14px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? 'var(--accent-amber)' : 'var(--chart-bar-1)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Tickets by Hostel Block
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockChartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-solid-fallback)',
                      border: '1px solid var(--glass-border-side)',
                      borderRadius: '14px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--chart-bar-3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // --- TICKETS TABLE & BULK ASSIGN ---
  if (activeSegment === 'tickets') {
    return (
      <div className="space-y-4">
        <GlassCard className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              All Campus Tickets ({filteredTickets.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by block"
                value={filterBlock}
                onChange={(e) => setFilterBlock(e.target.value)}
                className="glass-lens-input px-3 py-1.5 text-xs min-h-[38px]"
              >
                <option value="ALL" className="text-slate-900">All Blocks</option>
                <option value="Block A" className="text-slate-900">Block A</option>
                <option value="Block B" className="text-slate-900">Block B</option>
                <option value="Block C" className="text-slate-900">Block C</option>
              </select>
              <select
                aria-label="Filter by category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="glass-lens-input px-3 py-1.5 text-xs min-h-[38px]"
              >
                <option value="ALL" className="text-slate-900">All Categories</option>
                <option value="Plumbing" className="text-slate-900">Plumbing</option>
                <option value="Electrical" className="text-slate-900">Electrical</option>
                <option value="Cleaning" className="text-slate-900">Cleaning</option>
                <option value="Other" className="text-slate-900">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'Open', 'Assigned', 'In progress', 'Waiting for parts', 'Resolved', 'Reopened'].map((s) => (
              <GlassChip
                key={s}
                label={s === 'ALL' ? 'All' : s}
                selected={filterStatus === s}
                onClick={() => setFilterStatus(s)}
              />
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="glass-lens-card p-3 bg-[var(--accent-amber-soft)] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {selectedIds.length} selected for bulk assign
              </span>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select staff for bulk assignment"
                  value={bulkStaffId}
                  onChange={(e) => setBulkStaffId(e.target.value)}
                  className="glass-lens-input px-3 py-1.5 text-xs min-h-[38px]"
                >
                  {staffMembers.map((st) => (
                    <option key={st.id} value={st.id} className="text-slate-900">
                      {st.name} ({st.skills?.join('/')})
                    </option>
                  ))}
                </select>
                <GlassButton
                  size="sm"
                  variant="amber"
                  icon={<CheckSquare className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onBulkAssign(selectedIds, bulkStaffId);
                    setSelectedIds([]);
                  }}
                >
                  Bulk Assign
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>

        <div className="space-y-2.5">
          {filteredTickets.map((tk) => {
            const overdue = isTicketOverdue(tk);
            const checked = selectedIds.includes(tk.id);
            return (
              <GlassCard key={tk.id} overdue={overdue} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    aria-label={`Select ${tk.id}`}
                    onChange={() => toggleSelect(tk.id)}
                    className="mt-1 w-4 h-4 accent-[var(--accent-amber)] cursor-pointer"
                  />
                  <div className="space-y-1 cursor-pointer" onClick={() => onOpenTicket(tk)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-code text-xs font-bold text-[var(--text-primary)]">{tk.id}</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {tk.room} · {tk.category}
                      </span>
                      <StatusChip status={tk.status} overdue={overdue} lang={lang} />
                      <PriorityChip priority={tk.priority} lang={lang} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{tk.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label={`Assign staff to ${tk.id}`}
                    value={tk.assignedTo ?? ''}
                    onChange={(e) => e.target.value && onAssignTicket(tk.id, e.target.value)}
                    className="glass-lens-input px-3 py-1.5 text-xs min-h-[40px]"
                  >
                    <option value="" className="text-slate-900">Unassigned</option>
                    {staffMembers.map((st) => {
                      const activeJobs = tickets.filter(
                        (item) => item.assignedTo === st.id && item.status !== 'Closed' && item.status !== 'Resolved'
                      ).length;
                      return (
                        <option key={st.id} value={st.id} className="text-slate-900">
                          {st.name} · {st.skills?.[0]} ({activeJobs} active)
                        </option>
                      );
                    })}
                  </select>
                  <GlassButton size="sm" onClick={() => onOpenTicket(tk)}>
                    Timeline
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    );
  }

  // --- STAFF WORKLOAD ROSTER ---
  if (activeSegment === 'staff') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {staffMembers.map((st) => {
          const jobs = tickets.filter((tk) => tk.assignedTo === st.id && tk.status !== 'Closed');
          return (
            <GlassCard key={st.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] font-bold flex items-center justify-center">
                  {st.avatarInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{st.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{st.skills?.join(' · ')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--glass-border-side)]/40">
                <span className="text-[var(--text-secondary)]">Active jobs</span>
                <span className="font-mono-code font-bold text-[var(--accent-amber)]">{jobs.length}</span>
              </div>
              <GlassButton size="sm" className="w-full" icon={<Wrench className="w-3.5 h-3.5" />} onClick={() => onSwitchRole('staff', st.id)}>
                View as {st.name.split(' ')[0]}
              </GlassButton>
            </GlassCard>
          );
        })}
      </div>
    );
  }

  // --- REPORTS / SLA CONFIG + PERSONA SWITCH ---
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--accent-amber)]" />
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            Clock Tower SLA Rules (Hours per Priority)
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['Urgent', 'High', 'Medium', 'Low'] as TicketPriority[]).map((prio) => (
            <label key={prio} className="glass-lens-card p-3 space-y-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{prio}</span>
              <input
                type="number"
                min={1}
                max={240}
                value={slaHours[prio]}
                onChange={(e) =>
                  onUpdateSla({ ...slaHours, [prio]: Math.max(1, Number(e.target.value) || 1) })
                }
                className="glass-lens-input w-full px-3 py-1.5 text-sm font-mono-code"
              />
            </label>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-[var(--accent-amber)]" /> Switch Persona
        </span>
        <div className="flex gap-2">
          <GlassButton size="sm" onClick={() => onSwitchRole('resident', 'res-aarav')}>
            Resident
          </GlassButton>
          <GlassButton size="sm" onClick={() => onSwitchRole('staff', 'stf-ramesh')}>
            Maintenance Staff
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
