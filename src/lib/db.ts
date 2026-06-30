import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blueprints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_name TEXT,
      client_email TEXT,
      app_name TEXT NOT NULL,
      app_description TEXT NOT NULL,
      industry TEXT,
      target_users TEXT,
      core_features TEXT[],
      constraints JSONB,
      tech_stack JSONB NOT NULL,
      full_blueprint JSONB,
      status TEXT DEFAULT 'partial' CHECK (status IN ('partial', 'full', 'assigned')),
      assigned_to UUID,
      ip_address TEXT,
      rate_limit_key TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      company TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      last_login TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id),
      token TEXT UNIQUE NOT NULL,
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      ip_address TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'generate',
      count INT DEFAULT 1,
      window_start TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (ip_address, action, window_start)
    );
  `);
  console.log("DB initialized");
}

export default pool;
