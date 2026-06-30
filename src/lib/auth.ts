import { NextRequest } from "next/server";
import pool from "./db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(clientId: string | null, isAdmin: boolean = false): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await pool.query(
    `INSERT INTO sessions (client_id, token, is_admin, expires_at) VALUES ($1, $2, $3, $4)`,
    [clientId, token, isAdmin, expiresAt]
  );
  
  return token;
}

export async function validateSession(req: NextRequest): Promise<{
  authenticated: boolean;
  isAdmin: boolean;
  clientId?: string;
}> {
  const token = req.cookies.get("blueprints_session")?.value;
  if (!token) return { authenticated: false, isAdmin: false };

  const result = await pool.query(
    `SELECT s.*, c.email FROM sessions s 
     LEFT JOIN clients c ON s.client_id = c.id 
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) return { authenticated: false, isAdmin: false };

  const session = result.rows[0];
  return {
    authenticated: true,
    isAdmin: session.is_admin,
    clientId: session.client_id,
  };
}

export async function ensureAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD || "Blueprint2026!Secure";
  const existing = await pool.query("SELECT id FROM clients WHERE email = 'admin@failfast.online'");
  
  if (existing.rows.length === 0) {
    const hash = hashPassword(adminPassword);
    await pool.query(
      `INSERT INTO clients (email, password_hash, display_name, company) VALUES ($1, $2, $3, $4)`,
      ["admin@failfast.online", hash, "Super Admin", "Nirvatec Industries"]
    );
    console.log("Admin user created");
  }
}
