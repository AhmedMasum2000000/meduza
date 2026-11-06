// Meduza API: the private side of Meduza Studio, running on your own server.
// Holds the API keys (encrypted at rest), the shared workspace, generated ideas and server health.
// No dependencies: Node 20+. Settings come from .env (install.sh writes it). Keys and request bodies are never logged.
import http from "node:http";
import os from "node:os";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, statfsSync } from "node:fs";
import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual, createHash } from "node:crypto";

const VERSION = "1.0.0";
const PORT = +process.env.PORT || 8787;
const DATA = process.env.DATA_DIR || "/data";
const PASS = process.env.ADMIN_PASSWORD || "";
const MKEY = Buffer.from(process.env.MASTER_KEY || "", "base64");
const ORIGINS = (process.env.ALLOWED_ORIGINS || "https://ahmedmasum2000000.github.io").split(",").map((s) => s.trim()).filter(Boolean);
if (PASS.length < 12 || MKEY.length !== 32) {
  console.error("ADMIN_PASSWORD (12+ characters) and MASTER_KEY (32 bytes, base64) must be set. install.sh writes both.");
  process.exit(1);
}
mkdirSync(DATA, { recursive: true });

// ---------- storage: small JSON files, written atomically ----------
const file = (n) => `${DATA}/${n}.json`;
const load = (n, d) => { try { return existsSync(file(n)) ? JSON.parse(readFileSync(file(n), "utf8")) : d; } catch { return d; } };
const store = (n, v) => { writeFileSync(file(n) + ".tmp", JSON.stringify(v), { mode: 0o600 }); renameSync(file(n) + ".tmp", file(n)); };
const enc = (text) => {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", MKEY, iv);
  const ct = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return { iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), ct: ct.toString("base64") };
};
const dec = (e) => {
  const d = createDecipheriv("aes-256-gcm", MKEY, Buffer.from(e.iv, "base64"));
  d.setAuthTag(Buffer.from(e.tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(e.ct, "base64")), d.final()]).toString("utf8");
};

// ---------- providers: how to check a key without spending money ----------
const bearer = (k) => ({ Authorization: `Bearer ${k}` });
const CHECK = {
  anthropic: (k) => ["https://api.anthropic.com/v1/models", { "x-api-key": k, "anthropic-version": "2023-06-01" }],
  openai: (k) => ["https://api.openai.com/v1/models", bearer(k)],
  gemini: (k) => ["https://generativelanguage.googleapis.com/v1beta/models", { "x-goog-api-key": k }],
  openrouter: (k) => ["https://openrouter.ai/api/v1/key", bearer(k)],
  deepseek: (k) => ["https://api.deepseek.com/models", bearer(k)],
  groq: (k) => ["https://api.groq.com/openai/v1/models", bearer(k)],
  mistral: (k) => ["https://api.mistral.ai/v1/models", bearer(k)],
  xai: (k) => ["https://api.x.ai/v1/models", bearer(k)],
  elevenlabs: (k) => ["https://api.elevenlabs.io/v1/user", { "xi-api-key": k }],
  replicate: (k) => ["https://api.replicate.com/v1/account", bearer(k)],
  stability: (k) => ["https://api.stability.ai/v1/user/account", bearer(k)],
  runway: (k) => ["https://api.dev.runwayml.com/v1/organization", { ...bearer(k), "X-Runway-Version": "2024-11-06" }],
  luma: (k) => ["https://api.lumalabs.ai/dream-machine/v1/generations?limit=1", bearer(k)],
  heygen: (k) => ["https://api.heygen.com/v2/user/remaining_quota", { "X-Api-Key": k }],
  leonardo: (k) => ["https://cloud.leonardo.ai/api/rest/v1/me", bearer(k)],
  pexels: (k) => ["https://api.pexels.com/v1/curated?per_page=1", { Authorization: k }],
  youtube: (k) => [`https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${encodeURIComponent(k)}`, {}],
  kling: null, fal: null, ideogram: null, tavily: null, postiz: null,
};
const validId = (id) => Object.hasOwn(CHECK, id) || /^custom-[a-z0-9-]{1,40}$/.test(id);

// Text models used for ideas, cheapest sensible default first. Override any with MODEL_<ID> in .env.
const OPENAI_LIKE = {
  openai: ["https://api.openai.com/v1", "gpt-4o-mini"], openrouter: ["https://openrouter.ai/api/v1", "openrouter/auto"],
  groq: ["https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"], deepseek: ["https://api.deepseek.com", "deepseek-chat"],
  mistral: ["https://api.mistral.ai/v1", "mistral-small-latest"], xai: ["https://api.x.ai/v1", "grok-3-mini"],
};
const TEXT_ORDER = ["anthropic", "openai", "gemini", "openrouter", "groq", "deepseek", "mistral", "xai"];
const model = (id, d) => process.env[`MODEL_${id.toUpperCase()}`] || d;

async function ask(id, key, prompt) {
  const go = async (url, opt) => {
    const r = await fetch(url, { ...opt, method: "POST", signal: AbortSignal.timeout(60000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${id} said: ${j.error?.message || j.error || "HTTP " + r.status}`);
    return j;
  };
  if (id === "anthropic") {
    const j = await go("https://api.anthropic.com/v1/messages", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: model(id, "claude-haiku-5-5"), max_tokens: 1500, messages: [{ role: "user", content: prompt }] }) });
    return j.content?.map((c) => c.text || "").join("") || "";
  }
  if (id === "gemini") {
    const j = await go(`https://generativelanguage.googleapis.com/v1beta/models/${model(id, "gemini-2.5-flash")}:generateContent`, { headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  }
  const [base, m] = OPENAI_LIKE[id];
  const j = await go(`${base}/chat/completions`, { headers: { ...bearer(key), "content-type": "application/json" },
    body: JSON.stringify({ model: model(id, m), messages: [{ role: "user", content: prompt }] }) });
  return j.choices?.[0]?.message?.content || "";
}

// ---------- http plumbing ----------
const fails = new Map(); // ip -> { n, until }
const aiCalls = [];
const ipOf = (req) => (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
const same = (a, b) => { const x = createHash("sha256").update(a).digest(), y = createHash("sha256").update(b).digest(); return timingSafeEqual(x, y); };

function send(res, code, body, origin) {
  const h = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (origin && ORIGINS.includes(origin)) Object.assign(h, { "Access-Control-Allow-Origin": origin, Vary: "Origin" });
  res.writeHead(code, h);
  res.end(JSON.stringify(body));
}
const readBody = (req) => new Promise((ok, bad) => {
  let size = 0; const parts = [];
  req.on("data", (c) => { size += c.length; if (size > 1_000_000) { bad(new Error("too big")); req.destroy(); } else parts.push(c); });
  req.on("end", () => { try { ok(parts.length ? JSON.parse(Buffer.concat(parts).toString("utf8")) : {}); } catch { bad(new Error("bad json")); } });
});

function status() {
  let disk = null;
  try { const s = statfsSync(DATA); disk = { total: s.blocks * s.bsize, free: s.bavail * s.bsize }; } catch {}
  const vault = load("vault", {});
  return { ok: true, version: VERSION, uptime: Math.round(os.uptime()), cpus: os.cpus().length, load: os.loadavg()[0],
    mem: { total: os.totalmem(), free: os.freemem() }, disk, keys: Object.keys(vault).length };
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url, "http://x"), path = url.pathname, m = req.method;
  const done = (code, body) => { send(res, code, body, origin); console.log(m, path, code); };
  if (m === "OPTIONS") {
    if (!ORIGINS.includes(origin)) return done(403, { error: "origin not allowed" });
    res.writeHead(204, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE", "Access-Control-Allow-Headers": "Authorization,Content-Type", "Access-Control-Max-Age": "600", Vary: "Origin" });
    return res.end();
  }
  if (path === "/api/health") return done(200, { ok: true, version: VERSION });

  // Everything else needs the admin password. Ten wrong tries lock that address out for 15 minutes.
  const ip = ipOf(req), f = fails.get(ip);
  if (f && f.until > Date.now()) return done(429, { error: "Too many wrong passwords. Try again in 15 minutes." });
  const tok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!tok || !same(tok, PASS)) {
    const n = (f?.n || 0) + 1; fails.set(ip, { n, until: n >= 10 ? Date.now() + 15 * 60_000 : 0 });
    return done(401, { error: "Wrong password" });
  }
  fails.delete(ip);

  try {
    if (path === "/api/status" && m === "GET") return done(200, status());

    if (path === "/api/workspace") {
      if (m === "GET") return done(200, load("workspace", { workspace: null }));
      if (m === "PUT") {
        const b = await readBody(req);
        if (!b.workspace || !Array.isArray(b.workspace.brands)) return done(400, { error: "workspace.brands must be a list" });
        store("workspace", { workspace: b.workspace, updatedAt: new Date().toISOString() });
        return done(200, { ok: true });
      }
    }

    if (path === "/api/keys" && m === "GET") {
      const v = load("vault", {});
      return done(200, { keys: Object.entries(v).map(([id, e]) => ({ id, label: e.label, last4: e.last4, savedAt: e.savedAt, test: e.test || null })) });
    }
    const km = path.match(/^\/api\/keys\/([a-z0-9-]+)(\/test)?$/);
    if (km) {
      const [, id, test] = km;
      if (!validId(id)) return done(400, { error: "Unknown provider" });
      const v = load("vault", {});
      if (!test && m === "PUT") {
        const b = await readBody(req), key = String(b.key || "").trim();
        if (key.length < 8 || key.length > 4000) return done(400, { error: "That doesn't look like a key" });
        v[id] = { ...enc(key), last4: key.slice(-4), label: String(b.label || "").slice(0, 60) || undefined, savedAt: new Date().toISOString() };
        store("vault", v);
        return done(200, { ok: true, last4: v[id].last4 });
      }
      if (!test && m === "DELETE") { delete v[id]; store("vault", v); return done(200, { ok: true }); }
      if (test && m === "POST") {
        if (!v[id]) return done(404, { error: "No key saved" });
        const check = CHECK[id];
        let result;
        if (!check) result = { ok: null, note: "Saved. This provider has no free check, so it is tested on first use." };
        else {
          const [u, headers] = check(dec(v[id]));
          try {
            const r = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
            result = r.ok ? { ok: true, note: "Working" } : r.status === 401 || r.status === 403 ? { ok: false, note: "Key rejected" } : { ok: null, note: `Couldn't check (HTTP ${r.status})` };
          } catch { result = { ok: null, note: "Couldn't reach the provider from the server" }; }
        }
        v[id].test = { ...result, at: new Date().toISOString() }; store("vault", v);
        return done(200, result);
      }
    }

    if (path === "/api/ai/ideas" && m === "POST") {
      const now = Date.now(); while (aiCalls.length && aiCalls[0] < now - 3600_000) aiCalls.shift();
      if (aiCalls.length >= 30) return done(429, { error: "Idea limit reached for this hour" });
      const b = await readBody(req), br = b.brand || {};
      const v = load("vault", {}), id = TEXT_ORDER.find((p) => v[p]);
      if (!id) return done(400, { error: "Add a text AI key in Admin first (Claude, OpenAI, Gemini or another)." });
      const clip = (s, n) => String(s || "").slice(0, n);
      const prompt = `You plan organic social media content. Brand: ${clip(br.name, 80)}. Niche: ${clip(br.niche, 80)}. Language: ${clip(br.lang, 40) || "English"}. About: ${clip(br.lane, 200)}.
Suggest 6 original content ideas likely to do well on short-form video and posts right now.
Rules: original ideas only, never copying someone else's content; no guaranteed results or get-rich claims; no fake engagement; no medical, legal or financial instructions presented as advice.
Reply with only a JSON array, no other text: [{"title": "...", "why": "..."}]. Write each title in ${clip(br.lang, 40) || "English"}. Write each "why" as one short English sentence on why it may land.`;
      aiCalls.push(now);
      const text = await ask(id, dec(v[id]), prompt);
      let ideas = [];
      try { ideas = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)); } catch {}
      ideas = (Array.isArray(ideas) ? ideas : []).filter((x) => x && x.title).slice(0, 8).map((x) => ({ title: clip(x.title, 160), why: clip(x.why, 200) }));
      if (!ideas.length) return done(502, { error: "The AI answered in an unexpected format. Try again." });
      return done(200, { ideas, via: id });
    }
    return done(404, { error: "Not found" });
  } catch (e) {
    return done(e.message === "too big" ? 413 : e.message === "bad json" ? 400 : 502, { error: e.message.slice(0, 200) });
  }
});
server.listen(PORT, () => console.log(`Meduza API ${VERSION} on :${PORT}, allowed sites: ${ORIGINS.join(", ")}`));
