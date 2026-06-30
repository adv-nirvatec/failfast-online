import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import pool from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { generateFullBlueprint } from "@/lib/blueprint-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await pool.query("SELECT * FROM blueprints WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch blueprint" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();

  const session = await validateSession(req);
  if (!session.authenticated || !session.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const blueprint = await pool.query("SELECT * FROM blueprints WHERE id = $1", [id]);
    if (blueprint.rows.length === 0) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    const bp = blueprint.rows[0];
    const fullBlueprint = await generateFullBlueprint(
      {
        appName: bp.app_name,
        appDescription: bp.app_description,
        industry: bp.industry,
        targetUsers: bp.target_users,
        coreFeatures: bp.core_features,
        constraints: bp.constraints,
      },
      bp.tech_stack
    );

    await pool.query(
      "UPDATE blueprints SET full_blueprint = $1, status = 'full', updated_at = NOW() WHERE id = $2",
      [JSON.stringify(fullBlueprint), id]
    );

    return NextResponse.json({ success: true, fullBlueprint });
  } catch (error: any) {
    console.error("Generate full blueprint error:", error);
    return NextResponse.json({ error: "Failed to generate full blueprint" }, { status: 500 });
  }
}
