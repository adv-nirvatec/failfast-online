import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-placeholder";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

// Vision model for screenshot analysis (uses the agent's configured vision provider)
const VISION_API_KEY = process.env.VISION_API_KEY || "";
const VISION_BASE_URL = process.env.VISION_BASE_URL || "https://api.openai.com/v1";

async function callDeepSeek(prompt: string, systemPrompt: string, maxTokens = 8000) {
  const apiKey = DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("DeepSeek API key not configured");

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error: ${res.status} - ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

async function callVision(base64Image: string, prompt: string): Promise<string> {
  // Try OpenAI API first, fall back to DeepSeek
  const visionKey = VISION_API_KEY;
  if (!visionKey) {
    // No vision key available — return empty analysis, code will fall back to text-only
    return "";
  }

  try {
    const res = await fetch(`${VISION_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${visionKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return "";
    const data = await res.json();
    return data.choices[0]?.message?.content || "";
  } catch {
    return "";
  }
}

async function takeScreenshot(url: string): Promise<string | null> {
  // We don't have Puppeteer in the Docker env.
  // Instead, use a lightweight screenshot service or return null.
  // For production, this would use a headless browser or screenshot API.
  try {
    // Try screenshot API (e.g. api.screenshotmachine.com or similar)
    // For now, return null — visual analysis is optional enhancement
    return null;
  } catch {
    return null;
  }
}

function extractBrandDNA(html: string, domain: string): {
  primaryColor: string; secondaryColor: string; isDark: boolean;
  logoUrl: string; fontFamily: string; tone: string;
} {
  let primaryColor = "#2563eb";
  let secondaryColor = "#7c3aed";
  let isDark = false;
  let logoUrl = "";
  let fontFamily = "system-ui, sans-serif";
  let tone = "professional";

  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const allStyles = styleMatches.join("");
  const allHtml = html.toLowerCase();

  const hexColors = allStyles.match(/#[0-9a-fA-F]{6}/g) || [];
  const colorCounts: Record<string, number> = {};
  hexColors.forEach((c) => {
    const lower = c.toLowerCase();
    if (lower === "#ffffff" || lower === "#000000" || lower === "#333333" ||
        lower === "#666666" || lower === "#999999" || lower === "#cccccc" ||
        lower === "#f0f0f0" || lower === "#eeeeee" || lower === "#dddddd") return;
    colorCounts[lower] = (colorCounts[lower] || 0) + 1;
  });
  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) primaryColor = sorted[0][0];
  if (sorted.length > 1) secondaryColor = sorted[1][0];

  const bodyBg = allStyles.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i);
  if (bodyBg) {
    const bg = bodyBg[1].toLowerCase();
    isDark = bg === "#000000" || bg === "#111111" || bg === "#0a0a0f" || bg === "#1a1a1a" || bg === "#121212" || bg === "#0d0d0d";
  }

  const logoMatch = html.match(/<img[^>]*src=["']([^"']*(?:logo|brand|icon)[^"']*\.(?:png|svg|jpg|jpeg|webp))["']/i) ||
                    html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i);
  if (logoMatch) logoUrl = logoMatch[1];

  const fontMatch = allStyles.match(/font-family\s*:\s*([^;};]+)/i) ||
                    html.match(/<link[^>]*href=["'][^"']*fonts\.googleapis\.com[^"']*family=([^&"']+)/i);
  if (fontMatch) {
    fontFamily = fontMatch[1].replace(/['"]/g, "").split(",")[0].trim();
    if (fontFamily.includes("+")) fontFamily = fontFamily.replace(/\+/g, " ");
  }

  const text = allHtml;
  if (text.includes("free") || text.includes("try") || text.includes("start")) tone = "conversion-focused";
  if (text.includes("enterprise") || text.includes("solution") || text.includes("platform")) tone = "enterprise";
  if (text.includes("luxury") || text.includes("premium") || text.includes("exclusive")) tone = "premium";
  if (text.includes("creative") || text.includes("design") || text.includes("studio")) tone = "creative";
  if (text.includes("learn") || text.includes("teach") || text.includes("course")) tone = "educational";

  return { primaryColor, secondaryColor, isDark, logoUrl, fontFamily, tone };
}

function isFacebookUrl(url: string): boolean {
  return url.includes("facebook.com") || url.includes("fb.com");
}

function extractFacebookIntel(html: string, url: string): {
  pageName: string; category: string; about: string; services: string[];
  location: string; contactInfo: string; postHighlights: string[];
} {
  const text = html.replace(/<[^>]+>/g, " ");
  const lower = text.toLowerCase();

  // Extract page name from title or meta
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const pageName = ogTitle?.[1] || titleMatch?.[1]?.split("|")[0]?.split("–")[0]?.trim() || "Local Business";

  // Category detection
  let category = "Local Business";
  const catMatch = text.match(/(?:category|type)\s*[:\-]\s*([^.\n]{5,80})/i);
  if (catMatch) category = catMatch[1].trim();
  if (lower.includes("restaurant")) category = "Restaurant";
  if (lower.includes("salon") || lower.includes("barber") || lower.includes("spa")) category = "Beauty & Wellness";
  if (lower.includes("shop") || lower.includes("store") || lower.includes("boutique")) category = "Retail";
  if (lower.includes("real estate") || lower.includes("property")) category = "Real Estate";
  if (lower.includes("gym") || lower.includes("fitness")) category = "Fitness";
  if (lower.includes("doctor") || lower.includes("clinic") || lower.includes("medical")) category = "Healthcare";
  if (lower.includes("lawyer") || lower.includes("legal") || lower.includes("attorney")) category = "Legal Services";
  if (lower.includes("plumb") || lower.includes("electric") || lower.includes("contractor") || lower.includes("repair")) category = "Home Services";

  // About text
  const aboutMatch = text.match(/(?:about|description|story|our mission)[:\s]*([^\n]{40,300})/i);
  const about = aboutMatch?.[1]?.trim() || metaDesc?.[1] || `Welcome to ${pageName} — your local ${category.toLowerCase()} provider.`;

  // Services
  const services: string[] = [];
  const serviceKeywords = ["service", "offer", "provide", "specializ", "expertise"];
  serviceKeywords.forEach((kw) => {
    const re = new RegExp(`${kw}\\s*(?:include)?[:\\s]+([^.!?]{10,120})`, "gi");
    let m;
    while ((m = re.exec(text)) !== null) {
      services.push(m[1].trim());
    }
  });
  if (services.length === 0) {
    // Extract from page content
    const bulletMatch = text.match(/(?:•|›|→|\-)\s*([^•›→\-.\n]{10,80})/g);
    if (bulletMatch) {
      bulletMatch.slice(0, 6).forEach((b) => {
        const clean = b.replace(/[•›→\-]\s*/, "").trim();
        if (clean.length > 10) services.push(clean);
      });
    }
  }

  // Location
  let location = "";
  const locMatch = text.match(/(?:address|location|based in|located in)\s*[:\s]+([^.\n]{10,100})/i);
  if (locMatch) location = locMatch[1].trim();

  // Contact info
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s\-])?\(?\d{2,4}\)?[\s\-]\d{2,4}[\s\-]\d{2,4}/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const contactInfo = [phoneMatch?.[0], emailMatch?.[0]].filter(Boolean).join(" | ");

  // Post highlights
  const postHighlights: string[] = [];
  const postPattern = /<div[^>]*class="[^"]*userContent[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let postMatch;
  while ((postMatch = postPattern.exec(html)) !== null && postHighlights.length < 5) {
    const clean = postMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (clean.length > 20 && clean.length < 300) postHighlights.push(clean);
  }

  return { pageName, category, about, services: services.slice(0, 4), location, contactInfo, postHighlights };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let fetchUrl = url.trim();
    if (!fetchUrl.startsWith("http://") && !fetchUrl.startsWith("https://")) {
      fetchUrl = "https://" + fetchUrl;
    }

    // Fetch the target website
    let htmlContent = "";
    let fetchError = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const pageRes = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      clearTimeout(timeout);

      if (!pageRes.ok) {
        fetchError = `Could not fetch URL (HTTP ${pageRes.status})`;
      } else {
        htmlContent = await pageRes.text();
      }
    } catch (e: any) {
      fetchError = e.message || "Failed to fetch URL";
    }

    if (fetchError && !htmlContent) {
      return NextResponse.json({ error: fetchError }, { status: 422 });
    }

    const domain = new URL(fetchUrl).hostname.replace("www.", "");
    const siteName = domain.split(".")[0];
    const mode = isFacebookUrl(fetchUrl) ? "facebook" : "website";

    // ─── MODE 1: Facebook page → website ───
    if (mode === "facebook") {
      const fbIntel = extractFacebookIntel(htmlContent, fetchUrl);

      const systemPrompt = `You are a senior web designer at FailFast. You build beautiful, modern business websites from scratch. You're given intelligence extracted from a Facebook business page — the business has no website.

CRITICAL: Output ONLY complete, valid HTML with inline CSS. No markdown, no code block wrappers. Start with <!DOCTYPE html>.

DESIGN RULES:
- Choose brand-appropriate colors based on the business category (not our brand colors).
  Restaurant: warm reds/oranges. Beauty: soft pinks/rose gold. Healthcare: blues/teals. Legal: navy/gold. Home services: earthy greens/blues.
- Match the tone of the business (friendly, professional, luxury, etc).
- Structure: sticky nav with business name → hero with headline/CTA → services/offerings in cards → about section with key info → contact/location section → footer.
- Apply glassmorphism: backdrop-blur, translucent card backgrounds, subtle borders.
- Modern typography, generous spacing, responsive with max-width container.
- Include a subtle "Built by FailFast" link to https://failfast.online in the footer.
- Use the exact business name, category, services provided.
- Keep it under 12KB.`;

      const userPrompt = `Build a complete landing page for this business based on their Facebook presence:

BUSINESS NAME: ${fbIntel.pageName}
CATEGORY: ${fbIntel.category}
LOCATION: ${fbIntel.location || "Local"}
CONTACT: ${fbIntel.contactInfo || "Available via Facebook"}
ABOUT: ${fbIntel.about}

SERVICES/OFFERINGS:
${fbIntel.services.map((s, i) => `${i + 1}. ${s}`).join("\n") || "Contact for details"}

${fbIntel.postHighlights.length > 0 ? `
RECENT POSTS (for context on what they do):
${fbIntel.postHighlights.map((p, i) => `${i + 1}. ${p}`).join("\n")}
` : ""}

FACEBOOK URL: ${fetchUrl}

Create a professional, modern landing page. Output ONLY the HTML.`;

      const aiHtml = await callDeepSeek(userPrompt, systemPrompt);

      let cleanHtml = cleanAiHtml(aiHtml, siteName);
      cleanHtml = sanitizeHtml(cleanHtml);

      return NextResponse.json({
        success: true,
        html: cleanHtml,
        originalUrl: fetchUrl,
        siteName: fbIntel.pageName,
        mode: "facebook",
        brandDNA: { primaryColor: "#2563eb", secondaryColor: "#059669", isDark: false },
        fbIntel: { name: fbIntel.pageName, category: fbIntel.category, location: fbIntel.location },
      });
    }

    // ─── MODE 2: Standard website → enhanced version ───

    // Extract brand DNA
    const brand = extractBrandDNA(htmlContent, domain);
    const stripped = stripHtml(htmlContent);

    // Attempt screenshot for visual analysis
    let visualAnalysis = "";
    const screenshot = await takeScreenshot(fetchUrl);
    if (screenshot) {
      visualAnalysis = await callVision(screenshot,
        "Analyze this webpage screenshot. Describe: 1) Overall layout structure 2) Color scheme 3) What looks outdated or broken 4) What should be preserved 5) Visual hierarchy and readability issues. Be concise — 5-8 bullet points."
      );
    }

    const systemPrompt = `You are a senior web designer at FailFast. You enhance existing websites by preserving their brand identity while applying modern design patterns.

CRITICAL: You MUST use the original brand's color scheme. Do NOT override it with our colors. The brand identity is sacred — only the layout, spacing, and modern UI patterns should be enhanced.

DESIGN RULES:
- Output ONLY complete, valid HTML with inline CSS. No markdown, no code block wrappers. Start with <!DOCTYPE html>.
- PRESERVE the primary and secondary brand colors. Use them for accents, CTAs, gradients, and card borders.
- Match the original site's dark/light preference.
- Apply modern layout: glassmorphism (backdrop-blur, translucent cards), generous spacing, clean typography.
- Use the provided font family if available, otherwise system font stack.
- Structure: sticky nav, hero, features/services cards (3-4), stats bar, CTA section, footer.
- The footer must include: "Enhanced by" followed by the original URL and "by FailFast" linking to https://failfast.online — subtle, small.
- Make the page responsive with a max-width container.
- Keep it under 12KB output size.
- Do NOT include any JavaScript frameworks or external dependencies.
- Match the tone of the original content.`;

    const userPrompt = `Enhance the landing page for ${siteName} (${fetchUrl}).

ORIGINAL BRAND DNA (extracted from their site):
- Primary color: ${brand.primaryColor}
- Secondary color: ${brand.secondaryColor}
- Dark mode: ${brand.isDark ? "YES — use dark background" : "NO — use light background"}
- Font family: ${brand.fontFamily}
- Brand tone: ${brand.tone}
- Logo: ${brand.logoUrl || "Use site name as text"}

${visualAnalysis ? `SCREENSHOT ANALYSIS:\n${visualAnalysis}\n` : ""}

ORIGINAL PAGE CONTENT:
${stripped.slice(0, 4000)}

${fetchError ? `NOTE: Site had loading issues. Build a fresh page using brand colors.` : "Site loaded successfully. Enhance while keeping brand identity."}

INSTRUCTIONS:
1. PRIMARY COLOR (${brand.primaryColor}) for: buttons, CTAs, gradient accents, section headers, link highlights.
2. SECONDARY COLOR (${brand.secondaryColor}) for: hover states, secondary cards, subtle accents.
3. Use ${brand.isDark ? "DARK" : "LIGHT"} mode throughout.
4. Structure: nav → hero → features cards → stats → CTA → footer.
5. Output ONLY the HTML — no explanation.`;

    const aiHtml = await callDeepSeek(userPrompt, systemPrompt);

    let cleanHtml = cleanAiHtml(aiHtml, siteName);
    cleanHtml = sanitizeHtml(cleanHtml);

    return NextResponse.json({
      success: true,
      html: cleanHtml,
      originalUrl: fetchUrl,
      siteName,
      mode: "website",
      brandDNA: { primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor, isDark: brand.isDark },
      visualAnalyzed: !!visualAnalysis,
    });
  } catch (error: any) {
    console.error("Enhance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enhance website" },
      { status: 500 }
    );
  }
}

function cleanAiHtml(aiHtml: string, fallbackName: string): string {
  const htmlMatch = aiHtml.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlMatch) return htmlMatch[0];

  const codeMatch = aiHtml.match(/```html?\s*([\s\S]*?)```/);
  let clean = codeMatch ? codeMatch[1].trim() : aiHtml;

  if (!clean.startsWith("<!DOCTYPE")) {
    clean = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${fallbackName}</title>\n<style>body{margin:0;padding:0;}</style>\n</head>\n<body>${clean}</body>\n</html>`;
  }

  return clean;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
}

function stripHtml(html: string): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

  cleaned = cleaned
    .replace(/<h[1-6][^>]*>/gi, "\n## ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<[^>]+>/g, "");

  cleaned = cleaned.split("\n").map((line) => line.trim()).filter((line) => line.length > 1).join("\n");
  return cleaned.slice(0, 5000);
}
