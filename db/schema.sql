-- Fix It Fast: Hostel Maintenance Complaints
-- PostgreSQL / Supabase / Neon Schema (aligned with ROLE.txt Section 9)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'warden', 'staff')),
  room TEXT,
  block TEXT CHECK (block IN ('Block A', 'Block B', 'Block C')),
  skills TEXT[] DEFAULT '{}',
  avatar_initials TEXT NOT NULL,
  active_workload INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  block TEXT NOT NULL CHECK (block IN ('Block A', 'Block B', 'Block C')),
  category TEXT NOT NULL CHECK (category IN ('Plumbing', 'Electrical', 'Cleaning', 'Other')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (
    status IN ('Open', 'Assigned', 'In progress', 'Waiting for parts', 'Resolved', 'Closed', 'Reopened')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  resident_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  reopen_count INTEGER NOT NULL DEFAULT 0,
  nudged_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('resident', 'warden', 'staff')),
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  photo TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('submitted', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'reopened', 'overdue', 'nudged')
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_due ON tickets (status, due_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resident ON tickets (resident_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_timeline_ticket ON timeline_events (ticket_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read_at);
