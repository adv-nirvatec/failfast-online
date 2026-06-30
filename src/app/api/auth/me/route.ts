import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await validateSession(req);
  return NextResponse.json(session);
}
