import type { BuildingId } from '../types/domain';

export interface BuildingMeta {
  id: BuildingId;
  name: string;
  subtitle: string;
  position: [number, number, number];
  focusDistance: number;
  viewDirection: [number, number, number];
}

export const BUILDINGS: Record<BuildingId, BuildingMeta> = {
  hostel_block: {
    id: 'hostel_block',
    name: 'Hostel Block',
    subtitle: 'File a new complaint',
    position: [-8.5, 1.8, -3.5],
    focusDistance: 12,
    viewDirection: [0.35, 0.42, 0.85],
  },
  notice_board: {
    id: 'notice_board',
    name: 'Notice Board Tower',
    subtitle: 'My tickets & live timeline',
    position: [-2.8, 1.5, 4.2],
    focusDistance: 8.5,
    viewDirection: [0.25, 0.35, 0.9],
  },
  wardens_office: {
    id: 'wardens_office',
    name: "Warden's Office",
    subtitle: 'Pending, overdue & assignments',
    position: [7.8, 1.6, -2.5],
    focusDistance: 10.5,
    viewDirection: [-0.35, 0.42, 0.85],
  },
  workshop: {
    id: 'workshop',
    name: 'Maintenance Workshop',
    subtitle: 'Staff queue & live updates',
    position: [8.4, 1.5, 5.2],
    focusDistance: 10,
    viewDirection: [-0.45, 0.4, 0.8],
  },
  utility_yard: {
    id: 'utility_yard',
    name: 'Utility Yard',
    subtitle: 'Plumbing · Electrical · Cleaning',
    position: [1.5, 1.2, 7.6],
    focusDistance: 9.5,
    viewDirection: [0.15, 0.45, 0.88],
  },
  clock_tower: {
    id: 'clock_tower',
    name: 'Clock Tower',
    subtitle: 'SLA timers & overdue monitor',
    position: [0.2, 4.2, -8.8],
    focusDistance: 13.5,
    viewDirection: [0.1, 0.35, 0.92],
  },
  feedback_gazebo: {
    id: 'feedback_gazebo',
    name: 'Feedback Gazebo',
    subtitle: 'Confirm resolution & rate',
    position: [-7.4, 1.4, 5.8],
    focusDistance: 9.5,
    viewDirection: [0.45, 0.4, 0.8],
  },
  main_gate: {
    id: 'main_gate',
    name: 'Main Gate',
    subtitle: 'Role selection & sign-in',
    position: [0, 1.5, 11.8],
    focusDistance: 10,
    viewDirection: [0, 0.35, 0.94],
  },
};

export const CAMPUS_VIEWS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  overview: { position: [0, 15.5, 24.5], target: [0, 1.6, 0] },
  hostel_block: { position: [-4.2, 6.8, 7.5], target: [-8.5, 1.8, -3.5] },
  notice_board: { position: [-0.5, 4.8, 12.2], target: [-2.8, 1.5, 4.2] },
  wardens_office: { position: [3.8, 6.4, 7.2], target: [7.8, 1.6, -2.5] },
  workshop: { position: [4.2, 5.8, 13.5], target: [8.4, 1.5, 5.2] },
  utility_yard: { position: [3.2, 5.5, 16.5], target: [1.5, 1.2, 7.6] },
  clock_tower: { position: [1.5, 9.2, 4.5], target: [0.2, 4.2, -8.8] },
  feedback_gazebo: { position: [-3.2, 5.4, 13.8], target: [-7.4, 1.4, 5.8] },
  main_gate: { position: [0, 5.2, 21.5], target: [0, 1.5, 11.8] },
};
