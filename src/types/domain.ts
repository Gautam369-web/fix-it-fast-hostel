export type UserRole = 'resident' | 'warden' | 'staff';

export type TicketCategory = 'Plumbing' | 'Electrical' | 'Cleaning' | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TicketStatus =
  | 'Open'
  | 'Assigned'
  | 'In progress'
  | 'Waiting for parts'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export type HostelBlock = 'Block A' | 'Block B' | 'Block C';

export type ThemeMode = 'obsidian' | 'frost';

export type LanguageCode = 'en' | 'hi';

export type TextSizeMode = 'compact' | 'default' | 'large';

export type BuildingId =
  | 'hostel_block'
  | 'notice_board'
  | 'wardens_office'
  | 'workshop'
  | 'utility_yard'
  | 'clock_tower'
  | 'feedback_gazebo'
  | 'main_gate';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  room?: string;
  block?: HostelBlock;
  skills?: TicketCategory[];
  avatarInitials: string;
  activeWorkload?: number;
}

export interface Ticket {
  id: string;
  room: string;
  block: HostelBlock;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  photos: string[];
  status: TicketStatus;
  createdAt: string;
  dueAt: string;
  assignedTo: string | null;
  residentId: string;
  rating: number | null;
  ratingComment?: string;
  reopenCount: number;
  nudgedAt?: string | null;
  offlineQueued?: boolean;
}

export interface TimelineEvent {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  status: TicketStatus;
  note: string;
  photo?: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  ticketId: string;
  type: 'submitted' | 'assigned' | 'in_progress' | 'waiting_parts' | 'resolved' | 'reopened' | 'overdue' | 'nudged';
  title: string;
  body: string;
  timestamp: string;
  readAt: string | null;
}

export interface SlaHoursConfig {
  Urgent: number;
  High: number;
  Medium: number;
  Low: number;
}

export interface AppSettings {
  theme: ThemeMode;
  language: LanguageCode;
  textSize: TextSizeMode;
  highContrast: boolean;
  reducedTransparency: boolean;
  force2DMode: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  slaHours: SlaHoursConfig;
}

export interface OrbJourneyState {
  ticketId: string;
  status: TicketStatus;
  isOverdue: boolean;
  category: TicketCategory;
  priority: TicketPriority;
  room: string;
  block: HostelBlock;
  scrubProgress?: number; // 0..1 when scrubbing 2D timeline
  stationIndex: number; // 0..7 storyboard stage
  caption: string;
}

export interface DockSegment {
  id: string;
  labelKey: string;
  building: BuildingId;
  badge?: number;
}
