#!/usr/bin/env node
// Simple screenshot service — takes URL, returns base64 PNG
// Called by the /api/enhance route from within Docker via host network

const puppeteer = require("puppeteer");
const http = require("http");

const PORT = process.env.SCREENSHOT_PORT || 3015;
const HOST = process.env.SCREENSHOT_HOST || "127.0.0.1";

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browser;
}

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Screenshot endpoint: POST /screenshot { url: "..." }
  if (req.method === "POST" && req.url === "/screenshot") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { url } = JSON.parse(body);
        if (!url) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "URL required" }));
          return;
        }

        const b = await getBrowser();
        const page = await b.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Timeout for slow pages
        await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

        const screenshot = await page.screenshot({ type: "png", encoding: "base64" });
        await page.close();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, image: screenshot }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Screenshot service running on ${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (browser) await browser.close();
  process.exit(0);
});
