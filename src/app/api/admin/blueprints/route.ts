import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import pool from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const result = await pool.query(
      `SELECT id, client_name, client_email, app_name, app_description, industry, status, 
              assigned_to, created_at, updated_at
       FROM blueprints 
       ORDER BY created_at DESC 
       LIMIT 50`
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Admin blueprints error:", error);
    return NextResponse.json({ error: "Failed to fetch blueprints" }, { status: 500 });
  }
}

// Assign blueprint to a client
export async function PATCH(req: NextRequest) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { blueprintId, clientEmail } = await req.json();
    if (!blueprintId || !clientEmail) {
      return NextResponse.json({ error: "blueprintId and clientEmail required" }, { status: 400 });
    }

    // Find or create client
    let clientResult = await pool.query("SELECT id FROM clients WHERE email = $1", [clientEmail]);
    
    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Client not found. Create the client account first." },
        { status: 404 }
      );
    }

    const clientId = clientResult.rows[0].id;

    await pool.query(
      "UPDATE blueprints SET assigned_to = $1, status = 'assigned', updated_at = NOW() WHERE id = $2",
      [clientId, blueprintId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Assign blueprint error:", error);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}
