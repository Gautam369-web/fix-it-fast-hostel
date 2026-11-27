import { neon } from '@neondatabase/serverless';

declare const process: { env: Record<string, string | undefined> };

export default async function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!conn) {
    res.status(200).json({
      ok: true,
      service: 'fix-it-fast-hostel',
      mode: 'local-demo',
      databaseConfigured: false,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const sql = neon(conn);
    await sql`SELECT 1 AS alive`;
    res.status(200).json({
      ok: true,
      service: 'fix-it-fast-hostel',
      mode: 'database',
      databaseConfigured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      service: 'fix-it-fast-hostel',
      mode: 'error',
      error: err instanceof Error ? err.message : 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
}
