// Zero-dependency Vercel Serverless Function for deployment & DB readiness verification.
// Expand with Postgres/Supabase/Neon queries when connecting your database.
export default function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  const databaseConfigured = Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL
  );
  res.status(200).json({
    ok: true,
    service: 'fix-it-fast-hostel',
    mode: databaseConfigured ? 'database' : 'local-demo',
    timestamp: new Date().toISOString(),
  });
}
