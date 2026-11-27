import { neon } from '@neondatabase/serverless';

declare const process: { env: Record<string, string | undefined> };

type SqlClient = ReturnType<typeof neon>;

async function ensureSchema(sql: SqlClient): Promise<void> {
  await sql`
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
    )
  `;
  await sql`
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
    )
  `;
  await sql`
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
    )
  `;
  await sql`
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
    )
  `;
}

async function seedIfEmpty(sql: SqlClient, force = false): Promise<void> {
  if (force) {
    await sql`TRUNCATE TABLE notifications, timeline_events, tickets, users CASCADE`;
  }
  const rows = (await sql`SELECT COUNT(*)::int AS cnt FROM users`) as Array<{ cnt: number }>;
  if ((rows[0]?.cnt ?? 0) > 0) return;

  const now = Date.now();
  const hAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
  const hFwd = (h: number) => new Date(now + h * 3600_000).toISOString();

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

async function fetchSnapshot(sql: SqlClient) {
  const [usersRows, ticketRows, timelineRows, notifRows] = await Promise.all([
    sql`SELECT * FROM users ORDER BY role, name`,
    sql`SELECT * FROM tickets ORDER BY created_at DESC`,
    sql`SELECT * FROM timeline_events ORDER BY timestamp ASC`,
    sql`SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 100`,
  ]);

  return {
    users: (usersRows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      room: r.room ?? undefined,
      block: r.block ?? undefined,
      skills: r.skills ?? undefined,
      avatarInitials: r.avatar_initials,
      activeWorkload: r.active_workload ?? 0,
    })),
    tickets: (ticketRows as any[]).map((r) => ({
      id: r.id,
      room: r.room,
      block: r.block,
      category: r.category,
      priority: r.priority,
      description: r.description,
      photos: r.photos ?? [],
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      dueAt: new Date(r.due_at).toISOString(),
      assignedTo: r.assigned_to ?? null,
      residentId: r.resident_id,
      rating: r.rating ?? null,
      ratingComment: r.rating_comment ?? undefined,
      reopenCount: r.reopen_count ?? 0,
      nudgedAt: r.nudged_at ? new Date(r.nudged_at).toISOString() : null,
    })),
    timeline: (timelineRows as any[]).map((r) => ({
      id: r.id,
      ticketId: r.ticket_id,
      actorId: r.actor_id,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      status: r.status,
      note: r.note,
      photo: r.photo ?? undefined,
      timestamp: new Date(r.timestamp).toISOString(),
    })),
    notifications: (notifRows as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      ticketId: r.ticket_id,
      type: r.type,
      title: r.title,
      body: r.body,
      timestamp: new Date(r.timestamp).toISOString(),
      readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
    })),
  };
}

export default async function handler(
  req: { method?: string; body?: any },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!conn) {
    res.status(503).json({ ok: false, mode: 'local-demo', error: 'DATABASE_URL not configured' });
    return;
  }

  try {
    const sql = neon(conn);
    await ensureSchema(sql);
    await seedIfEmpty(sql, false);

    if (req.method === 'GET') {
      const snapshot = await fetchSnapshot(sql);
      res.status(200).json({ ok: true, mode: 'database', snapshot });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      const { action, payload } = body;

      if (action === 'registerStudent') {
        const u = payload.user;
        await sql`
          INSERT INTO users (id, name, role, room, block, skills, avatar_initials, active_workload)
          VALUES (${u.id}, ${u.name}, 'resident', ${u.room}, ${u.block}, '{}', ${u.avatarInitials}, 0)
          ON CONFLICT (id) DO NOTHING
        `;
      } else if (action === 'createTicket') {
        const { ticket, event, notification } = payload;
        await sql`
          INSERT INTO tickets (id, room, block, category, priority, description, photos, status, created_at, due_at, assigned_to, resident_id, rating, reopen_count)
          VALUES (${ticket.id}, ${ticket.room}, ${ticket.block}, ${ticket.category}, ${ticket.priority}, ${ticket.description}, ${ticket.photos ?? []}, ${ticket.status}, ${ticket.createdAt}, ${ticket.dueAt}, ${ticket.assignedTo}, ${ticket.residentId}, NULL, 0)
        `;
        await sql`
          INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, photo, timestamp)
          VALUES (${event.id}, ${event.ticketId}, ${event.actorId}, ${event.actorName}, ${event.actorRole}, ${event.status}, ${event.note}, ${event.photo ?? null}, ${event.timestamp})
        `;
        if (notification) {
          await sql`
            INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
            VALUES (${notification.id}, ${notification.userId}, ${notification.ticketId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.timestamp}, NULL)
          `;
        }
      } else if (action === 'assignTicket') {
        const { ticketId, staffId, event, notification } = payload;
        await sql`UPDATE tickets SET assigned_to = ${staffId}, status = 'Assigned' WHERE id = ${ticketId}`;
        await sql`
          INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, timestamp)
          VALUES (${event.id}, ${event.ticketId}, ${event.actorId}, ${event.actorName}, ${event.actorRole}, ${event.status}, ${event.note}, ${event.timestamp})
        `;
        if (notification) {
          await sql`
            INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
            VALUES (${notification.id}, ${notification.userId}, ${notification.ticketId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.timestamp}, NULL)
          `;
        }
      } else if (action === 'postStatusUpdate') {
        const { ticketId, status, event, notification } = payload;
        await sql`UPDATE tickets SET status = ${status} WHERE id = ${ticketId}`;
        await sql`
          INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, photo, timestamp)
          VALUES (${event.id}, ${event.ticketId}, ${event.actorId}, ${event.actorName}, ${event.actorRole}, ${event.status}, ${event.note}, ${event.photo ?? null}, ${event.timestamp})
        `;
        if (notification) {
          await sql`
            INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
            VALUES (${notification.id}, ${notification.userId}, ${notification.ticketId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.timestamp}, NULL)
          `;
        }
      } else if (action === 'confirmAndRate') {
        const { ticketId, rating, ratingComment, event } = payload;
        await sql`
          UPDATE tickets SET status = 'Closed', rating = ${rating}, rating_comment = ${ratingComment ?? null}
          WHERE id = ${ticketId}
        `;
        await sql`
          INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, timestamp)
          VALUES (${event.id}, ${event.ticketId}, ${event.actorId}, ${event.actorName}, ${event.actorRole}, ${event.status}, ${event.note}, ${event.timestamp})
        `;
      } else if (action === 'reopenTicket') {
        const { ticketId, event, notification } = payload;
        await sql`
          UPDATE tickets SET status = 'Reopened', reopen_count = reopen_count + 1
          WHERE id = ${ticketId}
        `;
        await sql`
          INSERT INTO timeline_events (id, ticket_id, actor_id, actor_name, actor_role, status, note, photo, timestamp)
          VALUES (${event.id}, ${event.ticketId}, ${event.actorId}, ${event.actorName}, ${event.actorRole}, ${event.status}, ${event.note}, ${event.photo ?? null}, ${event.timestamp})
        `;
        if (notification) {
          await sql`
            INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
            VALUES (${notification.id}, ${notification.userId}, ${notification.ticketId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.timestamp}, NULL)
          `;
        }
      } else if (action === 'nudgeWarden') {
        const { ticketId, nudgedAt, notification } = payload;
        await sql`UPDATE tickets SET nudged_at = ${nudgedAt} WHERE id = ${ticketId}`;
        if (notification) {
          await sql`
            INSERT INTO notifications (id, user_id, ticket_id, type, title, body, timestamp, read_at)
            VALUES (${notification.id}, ${notification.userId}, ${notification.ticketId}, ${notification.type}, ${notification.title}, ${notification.body}, ${notification.timestamp}, NULL)
          `;
        }
      } else if (action === 'markNotifRead') {
        await sql`UPDATE notifications SET read_at = ${payload.readAt} WHERE id = ${payload.id}`;
      } else if (action === 'resetDemo') {
        await seedIfEmpty(sql, true);
      }

      const snapshot = await fetchSnapshot(sql);
      res.status(200).json({ ok: true, mode: 'database', snapshot });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Database request failed',
    });
  }
}
