import type { BuildingId, OrbJourneyState, Ticket, TicketStatus } from '../types/domain';

export interface StoryboardStep {
  index: number;
  status: TicketStatus | 'Overdue';
  label: string;
  fromBuilding: BuildingId;
  toBuilding: BuildingId;
  caption: string;
  orbState: 'launching' | 'hovering' | 'travelling' | 'working' | 'parked' | 'burst' | 'ribbon' | 'reversing' | 'flickering';
}

/**
 * 8-step "Complaint Journey" Storyboard (ROLE.txt Section 11)
 */
export const COMPLAINT_STORYBOARD: StoryboardStep[] = [
  {
    index: 0,
    status: 'Open',
    label: '1. Submit',
    fromBuilding: 'hostel_block',
    toBuilding: 'hostel_block',
    caption: 'Form folds into a liquid-glass orb; room window lights amber.',
    orbState: 'launching',
  },
  {
    index: 1,
    status: 'Assigned',
    label: '2. Assign',
    fromBuilding: 'hostel_block',
    toBuilding: 'wardens_office',
    caption: "Orb flies to Warden's Office tray and links a light thread to staff.",
    orbState: 'hovering',
  },
  {
    index: 2,
    status: 'In progress',
    label: '3. In Progress',
    fromBuilding: 'wardens_office',
    toBuilding: 'workshop',
    caption: 'Orb travels via Workshop to the room; repair tool loops overhead.',
    orbState: 'working',
  },
  {
    index: 3,
    status: 'Waiting for parts',
    label: '4. Waiting Parts',
    fromBuilding: 'workshop',
    toBuilding: 'utility_yard',
    caption: 'Orb parks at the Utility Yard with a slow breathing pulse.',
    orbState: 'parked',
  },
  {
    index: 4,
    status: 'Resolved',
    label: '5. Resolved',
    fromBuilding: 'utility_yard',
    toBuilding: 'hostel_block',
    caption: 'Orb returns to resident window in bright light; window dims.',
    orbState: 'burst',
  },
  {
    index: 5,
    status: 'Closed',
    label: '6. Confirm + Rate',
    fromBuilding: 'hostel_block',
    toBuilding: 'feedback_gazebo',
    caption: 'A ribbon carries the orb to Feedback Gazebo; stars fill in.',
    orbState: 'ribbon',
  },
  {
    index: 6,
    status: 'Reopened',
    label: '7. Reopened',
    fromBuilding: 'feedback_gazebo',
    toBuilding: 'wardens_office',
    caption: "Orb reverses in warm tint back to Warden's Office for escalation.",
    orbState: 'reversing',
  },
  {
    index: 7,
    status: 'Overdue',
    label: '8. Overdue SLA',
    fromBuilding: 'wardens_office',
    toBuilding: 'clock_tower',
    caption: 'Trail flickers amber and the Clock Tower pulses until action is taken.',
    orbState: 'flickering',
  },
];

export function statusToStationIndex(status: TicketStatus, isOverdue = false): number {
  if (isOverdue && status !== 'Resolved' && status !== 'Closed') return 7;
  switch (status) {
    case 'Open':
      return 0;
    case 'Assigned':
      return 1;
    case 'In progress':
      return 2;
    case 'Waiting for parts':
      return 3;
    case 'Resolved':
      return 4;
    case 'Closed':
      return 5;
    case 'Reopened':
      return 6;
  }
}

export function stationIndexToNormalizedProgress(index: number): number {
  const clamped = Math.max(0, Math.min(5, index));
  return clamped / 5;
}

export function buildOrbJourneyState(ticket: Ticket, isOverdue: boolean, scrubProgress?: number): OrbJourneyState {
  const stationIndex = statusToStationIndex(ticket.status, isOverdue);
  const step = COMPLAINT_STORYBOARD[stationIndex] ?? COMPLAINT_STORYBOARD[0];
  return {
    ticketId: ticket.id,
    status: ticket.status,
    isOverdue,
    category: ticket.category,
    priority: ticket.priority,
    room: ticket.room,
    block: ticket.block,
    scrubProgress,
    stationIndex,
    caption: step.caption,
  };
}

export type JourneyEventListener = (state: OrbJourneyState) => void;

/**
 * Central AnimationController synchronizing ticket status changes,
 * 3D TicketOrb path legs, window lights, timeline updates, and notifications.
 */
export class AnimationController {
  private listeners = new Set<JourneyEventListener>();
  private current: OrbJourneyState | null = null;

  subscribe(fn: JourneyEventListener): () => void {
    this.listeners.add(fn);
    if (this.current) fn(this.current);
    return () => this.listeners.delete(fn);
  }

  emitTicketJourney(ticket: Ticket, isOverdue: boolean, scrubProgress?: number): void {
    const next = buildOrbJourneyState(ticket, isOverdue, scrubProgress);
    this.current = next;
    for (const fn of this.listeners) fn(next);
  }

  emitStoryboardStage(stageIndex: number): void {
    const step = COMPLAINT_STORYBOARD[Math.max(0, Math.min(COMPLAINT_STORYBOARD.length - 1, stageIndex))];
    const synthetic: OrbJourneyState = {
      ticketId: 'DEMO-ORB',
      status: step.status === 'Overdue' ? 'In progress' : step.status,
      isOverdue: step.status === 'Overdue',
      category: 'Plumbing',
      priority: step.status === 'Overdue' ? 'Urgent' : 'High',
      room: 'A-204',
      block: 'Block A',
      stationIndex: step.index,
      caption: step.caption,
    };
    this.current = synthetic;
    for (const fn of this.listeners) fn(synthetic);
  }

  getCurrent(): OrbJourneyState | null {
    return this.current;
  }
}

export const animationController = new AnimationController();
