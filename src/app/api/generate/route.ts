import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint } from "@/lib/blueprint-generator";
import { initDB } from "@/lib/db";
import pool from "@/lib/db";
import { ensureAdmin } from "@/lib/auth";

// Simple in-memory rate limit fallback
const ipCounts = new Map<string, { count: number; resetAt: number }>();

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  await initDB();
  await ensureAdmin();
  initialized = true;
}

export async function POST(req: NextRequest) {
  await ensureInitialized();

  try {
    const body = await req.json();
    const {
      appName,
      appDescription,
      industry,
      targetUsers,
      coreFeatures,
      constraints,
      clientName,
      clientEmail,
    } = body;

    if (!appName || !appDescription) {
      return NextResponse.json(
        { error: "appName and appDescription are required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateKey = ip.split(",")[0].trim();
    const maxPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || "5");

    // DB-based rate limit
    const windowStart = new Date(Date.now() - 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO rate_limits (ip_address, action, window_start, count) 
       VALUES ($1, 'generate', NOW(), 1)
       ON CONFLICT (ip_address, action, window_start) DO UPDATE SET count = rate_limits.count + 1`,
      [rateKey]
    );

    // Clean up old rate limit rows
    await pool.query("DELETE FROM rate_limits WHERE window_start < $1", [windowStart]);

    const rateResult = await pool.query(
      "SELECT SUM(count) as total FROM rate_limits WHERE ip_address = $1 AND window_start >= $2",
      [rateKey, windowStart]
    );
    const totalGenerations = parseInt(rateResult.rows[0]?.total || "0");

    if (totalGenerations > maxPerHour) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Max ${maxPerHour} generations per hour. Please try again later.` },
        { status: 429 }
      );
    }

    // Sanitize inputs (length limits)
    const sanitizedInput = {
      appName: (appName as string).slice(0, 100),
      appDescription: (appDescription as string).slice(0, 2000),
      industry: (industry as string)?.slice(0, 100) || undefined,
      targetUsers: (targetUsers as string)?.slice(0, 500) || undefined,
      coreFeatures: Array.isArray(coreFeatures) ? coreFeatures.slice(0, 10).map((f: string) => f.slice(0, 200)) : undefined,
      constraints: constraints ? {
        budget: (constraints.budget as string)?.slice(0, 100),
        timeline: (constraints.timeline as string)?.slice(0, 100),
        compliance: Array.isArray(constraints.compliance) ? constraints.compliance.slice(0, 5) : undefined,
        platform: (constraints.platform as string)?.slice(0, 100),
        scale: (constraints.scale as string)?.slice(0, 100),
      } : undefined,
    };

    // Generate blueprint
    const result = await generateBlueprint(sanitizedInput);

    // Store in DB
    const insertResult = await pool.query(
      `INSERT INTO blueprints (client_name, client_email, app_name, app_description, industry, target_users, core_features, constraints, tech_stack, ip_address, rate_limit_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        (clientName as string)?.slice(0, 100) || null,
        (clientEmail as string)?.slice(0, 200) || null,
        sanitizedInput.appName,
        sanitizedInput.appDescription.slice(0, 1000),
        sanitizedInput.industry || null,
        sanitizedInput.targetUsers || null,
        sanitizedInput.coreFeatures || null,
        JSON.stringify(sanitizedInput.constraints || {}),
        JSON.stringify(result),
        rateKey,
        rateKey,
      ]
    );

    return NextResponse.json({
      success: true,
      blueprintId: insertResult.rows[0].id,
      techStack: result.techStack,
      blueprintDocuments: result.blueprintDocuments,
    });
  } catch (error: any) {
    console.error("Blueprint generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate blueprint" },
      { status: 500 }
    );
  }
}
