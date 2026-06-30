import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import pool from "@/lib/db";
import { validateSession, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const result = await pool.query(
    "SELECT id, email, display_name, company, created_at, last_login FROM clients ORDER BY created_at DESC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { email, password, displayName, company } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await pool.query("SELECT id FROM clients WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Client with this email already exists" }, { status: 409 });
    }

    const hash = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO clients (email, password_hash, display_name, company) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, company, created_at`,
      [email, hash, displayName || null, company || null]
    );

    return NextResponse.json({ success: true, client: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
