import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!conn) {
  console.error('Missing DATABASE_URL or POSTGRES_URL environment variable.');
  process.exit(1);
}

const sql = neon(conn);
const ddl = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
for (const stmt of ddl.split(';').map((s) => s.trim()).filter(Boolean)) {
  await sql.query(stmt);
}

const [{ cnt }] = await sql`SELECT COUNT(*)::int AS cnt FROM users`;
if (cnt === 0) {
  const now = Date.now();
  const hAgo = (h) => new Date(now - h * 3600000).toISOString();
  const hFwd = (h) => new Date(now + h * 3600000).toISOString();

  await sql`
    INSERT INTO users (id, name, role, room, block, skills, avatar_initials, active_workload)
    VALUES
      ('res-aarav', 'Aarav Mehta', 'resident', 'A-204', 'Block A', '{}', 'AM', 0),
      ('res-diya', 'Diya Nair', 'resident', 'B-112', 'Block B', '{}', 'DN', 0),
      ('war-kavita', 'Kavita Rao (Warden)', 'warden', NULL, 'Block A', '{}', 'KR', 0),
      ('stf-ramesh', 'Ramesh Verma', 'staff', NULL, NULL, ARRAY['Plumbing', 'Other'], 'RV', 2),
      ('stf-imran', 'Imran Khan', 'staff', NULL, NULL, ARRAY['Electrical'], 'IK', 1),
      ('stf-suman', 'Suman Devi', 'staff', NULL, NULL, ARRAY['Cleaning', 'Other'], 'SD', 1)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO tickets (id, room, block, category, priority, description, photos, status, created_at, due_at, assigned_to, resident_id, rating, rating_comment, reopen_count, nudged_at)
    VALUES
      ('FIF-1042', 'A-204', 'Block A', 'Plumbing', 'Urgent', 'Washbasin cold-water tap cartridge keeps dripping continuously and flooding the tray.', '{}', 'In progress', ${hAgo(6)}, ${hAgo(2)}, 'stf-ramesh', 'res-aarav', NULL, NULL, 0, NULL),
      ('FIF-1043', 'A-204', 'Block A', 'Electrical', 'High', 'Ceiling fan regulator hums loudly and cuts out on speed 3.', '{}', 'Assigned', ${hAgo(10)}, ${hFwd(14)}, 'stf-imran', 'res-aarav', NULL, NULL, 0, NULL),
      ('FIF-1044', 'B-112', 'Block B', 'Cleaning', 'Medium', 'Corridor drain grate outside B-112 is clogged with leaves after yesterday’s rain.', '{}', 'Open', ${hAgo(3)}, ${hFwd(45)}, NULL, 'res-diya', NULL, NULL, 0, NULL),
      ('FIF-1045', 'A-108', 'Block A', 'Electrical', 'Medium', 'Desk study lamp socket flickers when plugged in.', '{}', 'Waiting for parts', ${hAgo(52)}, ${hAgo(4)}, 'stf-imran', 'res-aarav', NULL, NULL, 0, ${hAgo(1)}),
      ('FIF-1046', 'C-305', 'Block C', 'Plumbing', 'Low', 'Bathroom exhaust louver rattles gently when windy.', '{}', 'Resolved', ${hAgo(28)}, ${hFwd(44)}, 'stf-ramesh', 'res-aarav', NULL, NULL, 0, NULL),
      ('FIF-1041', 'B-209', 'Block B', 'Cleaning', 'Low', 'Deep clean requested for water cooler alcove.', '{}', 'Closed', ${hAgo(76)}, ${hAgo(4)}, 'stf-suman', 'res-diya', 5, 'Spotless and quick!', 0, NULL)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, timestamp)
    VALUES
      ('ev-1', 'FIF-1042', 'res-aarav', 'Aarav Mehta', 'resident', 'Open', 'Reported continuous tap leak in A-204.', ${hAgo(6)}),
      ('ev-2', 'FIF-1042', 'war-kavita', 'Kavita Rao', 'warden', 'Assigned', 'Assigned to Ramesh Verma (Plumbing) with 4h Urgent SLA.', ${hAgo(5.5)}),
      ('ev-3', 'FIF-1042', 'stf-ramesh', 'Ramesh Verma', 'staff', 'In progress', 'Shut off local angle valve and replacing worn ceramic spindle.', ${hAgo(4.2)}),
      ('ev-4', 'FIF-1043', 'res-aarav', 'Aarav Mehta', 'resident', 'Open', 'Fan regulator buzzing loudly in A-204.', ${hAgo(10)}),
      ('ev-5', 'FIF-1043', 'war-kavita', 'Kavita Rao', 'warden', 'Assigned', 'Assigned to Imran Khan (Electrical).', ${hAgo(8)}),
      ('ev-6', 'FIF-1044', 'res-diya', 'Diya Nair', 'resident', 'Open', 'Corridor drain grate clogged near B-112.', ${hAgo(3)}),
      ('ev-7', 'FIF-1045', 'res-aarav', 'Aarav Mehta', 'resident', 'Open', 'Desk socket sparks slightly when plug moves.', ${hAgo(52)}),
      ('ev-8', 'FIF-1045', 'war-kavita', 'Kavita Rao', 'warden', 'Assigned', 'Assigned to Imran Khan.', ${hAgo(50)}),
      ('ev-9', 'FIF-1045', 'stf-imran', 'Imran Khan', 'staff', 'Waiting for parts', '16A modular switch plate ordered from campus electrical store.', ${hAgo(30)}),
      ('ev-10', 'FIF-1046', 'res-aarav', 'Aarav Mehta', 'resident', 'Open', 'Exhaust louver rattling in C-305.', ${hAgo(28)}),
      ('ev-11', 'FIF-1046', 'stf-ramesh', 'Ramesh Verma', 'staff', 'Resolved', 'Tightened damper pins and added rubber grommets. Ready for resident check.', ${hAgo(5)}),
      ('ev-12', 'FIF-1041', 'stf-suman', 'Suman Devi', 'staff', 'Resolved', 'Cleaned alcove and flushed drain line.', ${hAgo(40)}),
      ('ev-13', 'FIF-1041', 'res-diya', 'Diya Nair', 'resident', 'Closed', 'Confirmed fixed and rated 5 stars.', ${hAgo(38)})
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
    VALUES
      ('notif-1', 'res-aarav', 'FIF-1046', 'resolved', 'FIF-1046 marked Resolved', 'Ramesh Verma finished work in C-305. Tap to confirm & rate.', ${hAgo(5)}, NULL),
      ('notif-2', 'res-aarav', 'FIF-1042', 'in_progress', 'FIF-1042 is In progress', 'Ramesh Verma is replacing the tap cartridge in A-204.', ${hAgo(4.2)}, NULL),
      ('notif-3', 'war-kavita', 'FIF-1042', 'overdue', 'Overdue SLA: FIF-1042', 'Urgent plumbing ticket in A-204 exceeded 4h SLA.', ${hAgo(2)}, NULL)
    ON CONFLICT (id) DO NOTHING
  `;
}

const counts = await Promise.all([
  sql`SELECT COUNT(*)::int AS c FROM users`,
  sql`SELECT COUNT(*)::int AS c FROM tickets`,
  sql`SELECT COUNT(*)::int AS c FROM timeline_events`,
  sql`SELECT COUNT(*)::int AS c FROM notifications`,
]);
console.log('NEON_DB_READY', JSON.stringify({
  users: counts[0][0].c,
  tickets: counts[1][0].c,
  timeline_events: counts[2][0].c,
  notifications: counts[3][0].c,
}));
