import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
});

interface BlueprintInput {
  appName: string;
  appDescription: string;
  industry?: string;
  targetUsers?: string;
  coreFeatures?: string[];
  constraints?: {
    budget?: string;
    timeline?: string;
    compliance?: string[];
    platform?: string;
    scale?: string;
  };
}

export async function generateBlueprint(input: BlueprintInput) {
  const systemPrompt = `You are a senior solution architect at Nirvatec Industries. Your job is to produce detailed, actionable app blueprints for non-technical founders.

CRITICAL INFRASTRUCTURE CONSTRAINT: All apps are deployed on Tencent Cloud Lighthouse servers (Ubuntu 24.04, Docker, Nginx). NEVER recommend Vercel, Netlify, Supabase, Railway, Heroku, or any PaaS platform. Self-host everything on Lighthouse with Docker. Use PostgreSQL (not hosted DB services). Use systemd or Docker Compose for orchestration. The stack must be deployable with a single 'docker compose up -d --build'.

Given a founder's app description, produce a BLUEPRINT with TWO output sections:

## SECTION 1: TECH STACK (VISIBLE TO USER)
A highly detailed, visually structured tech stack card. This is what the user sees immediately.

Format as a structured JSON object with these keys:

{
  "techStack": {
    "frontend": [{ "layer": "Framework", "tech": "Next.js 15", "reason": "One sentence why" }],
    "backend": [{ "layer": "...", "tech": "...", "reason": "..." }],
    "database": [{ "layer": "...", "tech": "...", "reason": "..." }],
    "infrastructure": [{ "layer": "Hosting", "tech": "Tencent Cloud Lighthouse", "reason": "..." }, 
                       { "layer": "Reverse Proxy", "tech": "Nginx + Let's Encrypt", "reason": "..." },
                       { "layer": "Orchestration", "tech": "Docker Compose", "reason": "..." }],
    "integrations": [{ "layer": "...", "tech": "...", "reason": "..." }],
    "mvpCost": "Estimated monthly burn for MVP in USD (single number, e.g. '$35-50/mo')",
    "scaleUpCost": "Estimated monthly burn at scale in USD",
    "timeToMvp": "e.g. '4-6 weeks'",
    "summarySentence": "One compelling sentence explaining the tech approach in plain English"
  }
}

## SECTION 2: FULL BLUEPRINT DOCUMENTS (TITLES ONLY — NOT SHOWN TO USER)
These are section titles that will be listed but content is hidden behind consult gate.

Return them as:
{
  "blueprintDocuments": [
    { "title": "Architecture Overview", "description": "One line about what this doc covers" },
    { "title": "Database Schema", "description": "One line" },
    { "title": "API Design", "description": "One line" },
    { "title": "MVP Build Phases", "description": "One line" },
    { "title": "Scale-Up Strategy", "description": "One line" },
    { "title": "Cost Breakdown", "description": "One line" },
    { "title": "Security & Compliance", "description": "One line" },
    { "title": "Go-to-Market Recommendations", "description": "One line" }
  ]
}

RULES:
- NEVER recommend Vercel, Netlify, Supabase, Railway, Heroku, or any cloud PaaS.
- Self-host everything: Docker + Nginx on Tencent Lighthouse.
- PostgreSQL is self-hosted in Docker, not a service.
- Match tech to the app's specific needs — don't copy-paste generic stacks.
- The summarySentence MUST be compelling and non-technical.
- Keep reasons short — one sentence each max.
- Output ONLY valid JSON — no markdown wrapping, no code blocks.`;

  const userPrompt = `Generate a blueprint for the following app:

APP NAME: ${input.appName}
DESCRIPTION: ${input.appDescription}
INDUSTRY: ${input.industry || "General"}
TARGET USERS: ${input.targetUsers || "General audience"}
CORE FEATURES: ${(input.coreFeatures || []).join(", ") || "As described"}
${input.constraints?.budget ? `BUDGET: ${input.constraints.budget}` : ""}
${input.constraints?.timeline ? `TIMELINE: ${input.constraints.timeline}` : ""}
${input.constraints?.platform ? `PLATFORM: ${input.constraints.platform}` : ""}
${input.constraints?.compliance ? `COMPLIANCE: ${input.constraints.compliance.join(", ")}` : ""}
${input.constraints?.scale ? `EXPECTED SCALE: ${input.constraints.scale}` : ""}`;

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || "";
  
  // Extract JSON from response (handle possible markdown wrappers)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse blueprint JSON from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}

export async function generateFullBlueprint(input: BlueprintInput, techStack: any) {
  const systemPrompt = `You are a senior solution architect at Nirvatec Industries. You are generating the FULL blueprint documentation for a client.

CRITICAL: All hosting is on Tencent Cloud Lighthouse (Docker + Nginx). Never mention Vercel, Supabase, Railway, or any PaaS. Self-host everything.

Output valid JSON with these sections:

{
  "architecture": { "overview": "markdown text with architecture description", "diagram": "ASCII art diagram" },
  "databaseSchema": { "tables": [{"name": "table_name", "sql": "CREATE TABLE ...", "purpose": "..."}] },
  "apiDesign": { "endpoints": [{"method": "GET", "path": "/api/...", "purpose": "...", "auth": "yes/no"}] },
  "mvpPhases": [{"phase": 1, "name": "...", "weeks": "...", "goal": "...", "items": ["..."]}],
  "scaleUpPhases": [{"phase": 1, "name": "...", "trigger": "...", "changes": ["..."]}],
  "costBreakdown": { "mvp": [{"item": "...", "monthly": "$X"}], "scaleUp": [{"item": "...", "monthly": "$X"}] },
  "securityCompliance": { "measures": ["..."], "complianceFrameworks": ["..."] },
  "goToMarket": { "launchStrategy": "...", "targetChannels": ["..."], "monetization": "..." }
}`;

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Generate the full blueprint for:
APP: ${input.appName}
DESCRIPTION: ${input.appDescription}
TECH STACK: ${JSON.stringify(techStack)}
INDUSTRY: ${input.industry || "General"}
FEATURES: ${(input.coreFeatures || []).join(", ")}`
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse full blueprint JSON");
  return JSON.parse(jsonMatch[0]);
}
