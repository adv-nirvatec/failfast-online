import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import pool from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, app_name, app_description, industry, status, tech_stack, created_at, updated_at
       FROM blueprints 
       WHERE assigned_to = $1
       ORDER BY created_at DESC`,
      [session.clientId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Client blueprints error:", error);
    return NextResponse.json({ error: "Failed to fetch blueprints" }, { status: 500 });
  }
}
