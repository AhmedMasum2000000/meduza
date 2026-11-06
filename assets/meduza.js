// Meduza Studio. Starts empty: brands, pages, videos and ideas are the owner's own, saved on their server when connected.
const LINKS = {
  panel: "", // set to your control panel / war room address
  vpsRepo: "https://github.com/AhmedMasum2000000/hostingervps",
  engineRepo: "https://github.com/AhmedMasum2000000/meduza-engine",
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// Motion is on by default because this is the owner's own tool; the switch in the top bar turns it off and is remembered.
const calm = localStorage.getItem("meduzaMotion") === "off" || location.search.includes("still"); // ?still freezes motion for screenshots
document.documentElement.classList.toggle("calm", calm);

const icons = {
  home: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  studio: "M12 5v14M5 12h14",
  editor: "M6 6a2.5 2.5 0 1 0 0 .01M6 18a2.5 2.5 0 1 0 0 .01M8 8l12 10M8 16 20 6",
  videos: "M4 5h16v14H4zM4 9h16M9 5v4M15 5v4",
  ideas: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  analytics: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  brands: "M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 10h.01M15 10h.01",
  social: "M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  war: "M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6zM12 8v5M12 16h.01",
  review: "M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  admin: "M14.5 9.5a4 4 0 1 0-1.1 2.8L20 19v2h-3v-2h-2v-2h-2l.4-4.7M15.5 8.5h.01",
};
const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[n]}"/></svg>`;
// Every page, grouped by what you are doing. Drives the sidebar and the home page.
const GROUPS = [
  ["Create", "Make videos from footage or a script.", [["studio", "New video", "A few choices, then the engine takes over"], ["editor", "Editor", "Pin a note to any moment"]]],
  ["Curate", "Pick what to make. Approve what goes out.", [["ideas", "Ideas", "Topics pulled from what is working"], ["review", "Review", "Approve or send back"], ["videos", "Library", "Everything finished"]]],
  ["Brands and socials", "Every brand, its pages and its schedule.", [["brands", "Brands", "Every brand and its pages"], ["social", "Schedule", "What posts where, and when"], ["analytics", "Analytics", "Where viewers stay or leave"]]],
  ["Run", "Server, API keys, pipeline and spend.", [["war", "War room", "Health and money on one screen"], ["admin", "Admin", "API keys and your server"]]],
];
const PLATFORMS = ["Instagram", "Facebook", "YouTube", "TikTok", "X", "LinkedIn", "Threads", "Pinterest", "Bluesky", "Snapchat", "Website", "Other"];
const NICHES = ["Finance", "Beauty", "Fashion", "Fitness", "Food", "Sports", "Music", "Tech", "Gaming", "Education", "Travel", "Parenting", "Local business", "Real estate", "News", "Entertainment"];
const SWATCH = [["#ffd400", "#0f4a4a"], ["#ff9d6c", "#552413"], ["#8fb8ff", "#132a55"], ["#c6a4ff", "#2c1a55"], ["#ff5c8a", "#521327"], ["#b4f06a", "#2a4a10"], ["#6ce0ff", "#0d3d52"], ["#ffd9a0", "#4a3515"]];
const EMPTY = () => ({ cur: "all", brands: [], ideas: [], jobs: [] });
const KEY = "meduzaWorkspace";
let WS;
try { WS = JSON.parse(localStorage.getItem(KEY)) || EMPTY(); } catch { WS = EMPTY(); }
if (WS.sample) WS = EMPTY(); // the old demo workspace is cleared, not kept
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(WS)); } catch {} pushWS(); };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const B = (id) => WS.brands.find((b) => b.id === id);
// ---------- your server (Admin) ----------
const SKEY = "meduzaServer";
let SRV = null, online = false, pushT;
try { SRV = JSON.parse(localStorage.getItem(SKEY) || sessionStorage.getItem(SKEY) || "null"); } catch {}
async function api(path, opt = {}) {
  if (!SRV) throw new Error("Not connected");
  let r;
  try { r = await fetch(SRV.url + path, { method: opt.method || "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + SRV.pass }, body: opt.body ? JSON.stringify(opt.body) : undefined }); }
  catch { throw new Error("Can't reach the server. Check the address and that it is running."); }
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out.error || "Server said HTTP " + r.status);
  return out;
}
function pushWS() { if (!online) return; clearTimeout(pushT); pushT = setTimeout(() => api("/api/workspace", { method: "PUT", body: { workspace: WS } }).catch(() => toast("Couldn't save to your server")), 400); }
function srvPill() { const p = $("#srv"); if (p) p.innerHTML = online ? '<i class="dot"></i>Server connected' : '<i class="dot off"></i>Server not connected'; }
async function connect(quiet) {
  online = false;
  try {
    await api("/api/status"); online = true;
    const w = await api("/api/workspace");
    if (w.workspace && !w.workspace.sample) { WS = w.workspace; try { localStorage.setItem(KEY, JSON.stringify(WS)); } catch {} } else pushWS();
  } catch (e) { if (!quiet) toast(e.message); }
  srvPill(); return online;
}
const gb = (n) => (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + " GB";
const KEYS = [
  ["AI writing and coding", [["anthropic", "Claude (Anthropic)", "Scripts, research and code"], ["openai", "OpenAI", "GPT models and images"], ["gemini", "Google Gemini", "Cheap bulk text and translation"], ["openrouter", "OpenRouter", "Many models with one key"], ["deepseek", "DeepSeek", "Low-cost text"], ["groq", "Groq", "Very fast open models"], ["mistral", "Mistral", "Text models"], ["xai", "xAI Grok", "Grok models"]]],
  ["Video generation", [["runway", "Runway", "Text and image to video"], ["luma", "Luma Dream Machine", "Text to video"], ["kling", "Kling", "Video. Paste access key and secret as key:secret"], ["heygen", "HeyGen", "Avatar and talking-head video"], ["replicate", "Replicate", "Open video and image models"], ["fal", "fal.ai", "Fast open video and image models"]]],
  ["Image generation", [["stability", "Stability AI", "Stable Diffusion images"], ["leonardo", "Leonardo", "Images and design"], ["ideogram", "Ideogram", "Images with readable text"]]],
  ["Voice and music", [["elevenlabs", "ElevenLabs", "Voice-over and voices"]]],
  ["Research and stock", [["youtube", "YouTube Data API", "Trends and competitor videos"], ["pexels", "Pexels", "Free stock photos and video"], ["tavily", "Tavily", "Web research"]]],
  ["Publishing", [["postiz", "Postiz", "Posts to every connected page"]]],
];
const INSTALL = "curl -fsSL https://raw.githubusercontent.com/AhmedMasum2000000/meduza/main/server/install.sh | bash";
const krow = (id, name, what) => `<div class="krow" data-k="${id}"><div class="grow"><div class="title">${esc(name)}</div><small>${esc(what)}</small></div>
  <span class="kst muted">Not set</span>
  <form class="kform" data-act="save-key"><input class="field" type="password" name="key" placeholder="Paste key" autocomplete="off" aria-label="${esc(name)} key" required><button class="btn">Save</button></form>
  <button type="button" class="btn ghost" data-act="test" hidden>Test</button><button type="button" class="btn ghost danger" data-act="rm" hidden>Remove</button></div>`;
const col = (b) => SWATCH[(b?.c ?? 0) % SWATCH.length];
const sw = (b, s = "") => `<span class="swatch" style="${s}background:linear-gradient(150deg,${col(b)[0]},${col(b)[1]})"></span>`;
// Lists below are filtered by the brand picker.
// Videos the owner asked for. Each moves queued -> working -> review -> approved -> posted as the engine reports back.
const LABEL = { queued: "Queued", working: "Working", review: "In review", approved: "Approved", posted: "Posted" };
const CHIP = { queued: "", working: "cutting", review: "review", approved: "ready", posted: "ready" };
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
const JOBS = () => (WS.jobs || []).map((x) => [x.t, x.b, x.kind, ago(x.created), CHIP[x.status], LABEL[x.status], x]);
const job = (id) => (WS.jobs || []).find((x) => x.id === id);
const mine = (list) => list.filter((x) => B(x[1]) && (WS.cur === "all" || x[1] === WS.cur));
const curName = () => (WS.cur === "all" ? "all brands" : B(WS.cur)?.name || "all brands");
const picker = () => `<label class="wpick"><span class="muted">Showing</span><select class="field" data-pick><option value="all">All brands</option>${WS.brands.map((b) => `<option value="${b.id}"${b.id === WS.cur ? " selected" : ""}>${esc(b.name)}</option>`).join("")}</select></label>`;
const empty = (msg) => `<div class="emptyc"><p>${msg}</p><a class="btn ghost" href="#/brands">Go to Brands</a></div>`;
const rows = (list) => list.map(([t, id, k, d, s, l, x]) => `
  <div class="row"${x ? ` data-job="${x.id}"` : ""}>${sw(B(id))}
  <div class="grow"><div class="title">${esc(t)}</div><small>${esc(B(id).name)}, ${k.toLowerCase()}</small></div>
  <span class="num muted">${d}</span><span class="chip ${s}">${s === "cutting" ? '<i class="dot sting"></i>' : ""}${l}</span></div>`).join("");
const pageCount = () => WS.brands.reduce((n, b) => n + b.pages.length, 0);
const byPlatform = () => { const m = {}; WS.brands.filter((b) => WS.cur === "all" || b.id === WS.cur).forEach((b) => b.pages.forEach(([p]) => (m[p] = (m[p] || 0) + 1))); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
const brandCard = (b) => `<div class="panel bcard" data-b="${b.id}">
  ${sw(b, "width:64px;height:64px;border-radius:18px;")}
  <div><h2>${esc(b.name)}</h2><p class="muted">${esc(b.niche)}${b.lang ? " · " + esc(b.lang) : ""}${b.lane ? ". " + esc(b.lane) + "." : ""}</p></div>
  <span class="chip">${b.pages.length} ${b.pages.length === 1 ? "page" : "pages"}</span>
  <div class="socs">${b.pages.map(([p, h], i) => `<span class="soc"><b>${esc(p)}</b><span>${esc(h)}</span><button type="button" class="x" data-act="rm-page" data-i="${i}" aria-label="Remove ${esc(p)} ${esc(h)}">×</button></span>`).join("") || '<span class="muted">No pages yet. Add the first one below.</span>'}</div>
  <form class="addp" data-act="add-page"><select class="field" name="p" aria-label="Platform">${PLATFORMS.map((p) => `<option>${p}</option>`).join("")}</select><input class="field" name="h" placeholder="@handle or page name" aria-label="Handle or page name" required><button class="btn ghost">Add page</button></form>
  <div class="acts"><a class="btn ghost" href="#/studio" data-act="use">New video</a><a class="btn ghost" href="#/social" data-act="use">Schedule</a><button type="button" class="btn ghost" data-act="edit">Edit</button><button type="button" class="btn ghost danger" data-act="del">Delete</button></div></div>`;
const brandForm = (b = {}) => `<form class="panel bform" id="bf" data-id="${b.id || ""}"><h2>${b.id ? "Edit brand" : "Add a brand"}</h2><p class="muted">Any niche, any language. Pages come next.</p>
  <div class="grid g2" style="margin-top:12px">
    <label>Name<input class="field" name="name" required value="${esc(b.name)}" placeholder="Your brand name"></label>
    <label>Niche<input class="field" name="niche" list="niches" required value="${esc(b.niche)}" placeholder="Pick or type your own"></label>
    <label>Language<input class="field" name="lang" value="${esc(b.lang)}" placeholder="e.g. English, Bengali"></label>
    <label>What it's about<input class="field" name="lane" value="${esc(b.lane)}" placeholder="One line, e.g. Skincare on a budget"></label>
  </div><datalist id="niches">${NICHES.map((n) => `<option value="${n}">`).join("")}</datalist>
  <div class="acts" style="margin-top:14px"><button class="btn">${b.id ? "Save changes" : "Add brand"}</button><button type="button" class="btn ghost" data-act="cancel">Cancel</button></div></form>`;
const tide = (n, seed = 1) => `<div class="tide">${Array.from({ length: n }, (_, i) =>
  `<i style="height:${25 + ((i * 37 * seed + 13) % 70)}%;animation-delay:${i * 28}ms"></i>`).join("")}</div>`;
const wave = () => `<span class="wave">${Array.from({ length: 22 }, (_, i) => `<i style="--h:${4 + ((i * 53 + 7) % 18)}px;--i:${i}"></i>`).join("")}</span>`;
// Medusa's expressions: patches of the same drawing (x, y, w, h in % of the square), crossfaded over the base art.
const EX = {"smirk":[39.06,62.66,14.22,24.06],"smile":[32.34,42.5,36.25,47.66],"wink":[28.91,42.5,41.41,57.5],"cheek":[20.0,42.5,59.84,57.5],"pensive":[15.94,39.38,66.88,60.62],"hands":[27.34,43.91,36.56,56.09],"hearts":[9.06,33.91,58.44,66.09]};
const exes = () => Object.entries(EX).map(([n, [x, y, w, h]]) => `<span class="ex" data-x="${n}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;--lm:url(ex-${n}.webp);--pm:url(exp-${n}.webp)"><i class="p"></i><i class="l"></i></span>`).join("");
const medusa = (k) => `<span class="medusa ${k}"><i class="art"></i><i class="glint"></i>${exes()}</span>`;
const mood = (m, x) => $$(".ex", m).forEach((e) => e.classList.toggle("on", e.dataset.x === x));
// Idle acting: bored, then sassy. Tap her for hearts. Pauses while the tab is hidden.
let actT;
function act() {
  clearTimeout(actT); const m = $(".medusa.act"); if (!m || calm) return;
  const seq = [["", 2400], ["pensive", 2600], ["", 1500], ["smirk", 1600], ["", 1800], ["cheek", 2200], ["", 1500], ["wink", 1400], ["", 1700], ["smile", 2100], ["", 1600], ["hands", 1700]];
  let i = 0;
  const step = () => { if (!m.isConnected) return; if (!document.hidden) { i = (i + 1) % seq.length; mood(m, seq[i][0]); } actT = setTimeout(step, seq[i][1]); };
  actT = setTimeout(step, seq[0][1]);
  m.closest(".frame").onclick = () => { clearTimeout(actT); mood(m, "hearts"); actT = setTimeout(() => { mood(m, "smile"); actT = setTimeout(step, 1800); }, 2600); };
}
const seg = (id, items, on = 0) => `<div class="seg" data-seg="${id}"><span class="pill"></span>${items.map((t, i) => `<button class="${i === on ? "on" : ""}">${t}</button>`).join("")}</div>`;
const ring = (v, label, text, c = "var(--yellow)") => `<div class="vital"><svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/><circle class="v" cx="50" cy="50" r="40" style="--v:${v};--c:${c}"/></svg><div><b class="num">${text}</b><span class="muted">${label}</span></div></div>`;

const LOOKS = {
  "Overall style": [["Still water", "Slow, calm, one idea at a time", "#3a3d42", "#0a0a0b"], ["Riptide", "Fast cuts, big figures", "#5a1733", "#12060c"], ["Lantern", "Warm, close, story-led", "#5a4217", "#120d06"], ["Ledger", "Charts first, voice second", "#173a5a", "#060d1a"], ["Paper boat", "Light, playful, hand-drawn", "#2f5a17", "#0a1206"]],
  Captions: [["Whisper", "Small, under a pinned title"], ["Headline", "One bold line at a time"], ["Sing-along", "Each word lights as it's said"], ["Ticker", "Runs along the bottom edge"]],
  Effects: [["Card drop", "The frame shrinks into a card"], ["Word wall", "Giant words march behind"], ["Number rise", "Figures count up in place"], ["Split tide", "Before and after, side by side"], ["Side notes", "Small labels point at details"], ["Breath", "A slow push on key lines"]],
  Colour: [["Original", "As rendered", "#3a3d42", "#0a0a0b"], ["Deep sea", "Cool and saturated", "#0d3d6a", "#030a1a"], ["Lamp", "Warm evening light", "#6a4a1d", "#1a1006"], ["Newsprint", "Muted, low contrast", "#4a5258", "#14181a"]],
};
const looks = (tab) => LOOKS[tab].map(([n, d, a = "#2a2c30", b = "#0a0a0b"], i) => `
  <button class="look ${i === 0 ? "on" : ""}"><div class="phone" style="--a:${a};--b:${b}">
  <span class="bar" style="top:${22 + i * 6}%;--w:${46 + i * 9}%;animation-delay:${i * .3}s"></span>
  <span class="bar" style="top:${30 + i * 6}%;--w:${30 + i * 7}%;animation-delay:${i * .3 + .25}s"></span>
  <span class="cap">${tab === "Captions" ? n.toLowerCase() : ""}</span></div><b>${n}</b><small>${d}</small></button>`).join("");

const V = {
  home: () => `
    <div class="reel">
      <a class="feature" href="#/studio"><div class="shot a1"><span class="medusa inv" style="--s:78%;position:absolute;left:11%;top:-6%"><i class="art"></i></span></div><h2>Studio<span class="badge">New</span></h2><p>Raw file or script in, finished cut out</p></a>
      <a class="feature" href="#/editor"><div class="shot a2"></div><h2>Editor</h2><p>Pin a note to any frame, get a new version</p></a>
      <a class="feature" href="#/war"><div class="shot a3"></div><h2>War room</h2><p>Server, pipeline and spend on one screen</p></a>
      <a class="feature" href="#/brands"><div class="shot a4"></div><h2>Brands</h2><p>Any niche, any number of pages</p></a>
    </div>
    <div class="promo-row">
      <section class="promo"><div class="frame">${medusa("act")}</div>
        <div class="copy"><h1>Any niche.<br>Every page.<br><span class="y">Yours to approve.</span></h1>
        <p class="lead">Meduza writes, voices, cuts and packages for every brand you run, on every platform. Nothing goes out until you say so.</p>
        <a class="btn" href="#/studio">Start a new cut</a></div></section>
      <div class="hub">${GROUPS.map(([g, d, items]) => `<section class="hubc"><h2>${g}</h2><p class="muted">${d}</p>
        <div class="hubl">${items.map(([id, t, s]) => `<a href="#/${id}">${ico(id)}<span><b>${t}</b><small>${s}</small></span></a>`).join("")}</div></section>`).join("")}</div>
    </div>
    <div class="grid g4" style="margin-bottom:14px">
      ${[[WS.brands.length, "brands"], [pageCount(), "pages"], [new Set(WS.brands.flatMap((b) => b.pages.map(([p]) => p))).size, "platforms"], [new Set(WS.brands.map((b) => b.niche.toLowerCase())).size, "niches"]].map(([n, l], i) =>
        `<div class="panel stat"><b class="num" data-count="${n}">${n}</b><span class="muted">${l}</span></div>`).join("")}
    </div>
    <div class="grid split">
      <div class="panel"><div class="ph"><div><h2>Tonight's queue</h2><p class="muted">Waiting on the engine or on you.</p></div>${picker()}</div>${rows(mine(JOBS()).filter((r) => r[6].status !== "posted")) || `<div class="emptyc"><p>Nothing queued for ${esc(curName())}. ${WS.brands.length ? "Make a video in Studio." : "Start by adding your first brand."}</p><a class="btn ghost" href="#/${WS.brands.length ? "studio" : "brands"}">${WS.brands.length ? "New video" : "Add a brand"}</a></div>`}</div>
      <div class="panel"><h2>Waiting for your eye</h2><p class="muted">Flagged before anything goes out.</p>
        ${mine(JOBS()).filter((r) => r[6].status === "review").map(([t, id, , , , , x]) => `<div class="row"><div class="grow"><div class="title">${esc(t)}</div><small>${esc(B(id).name)}${x.flag ? " · " + esc(x.flag) : ""}</small></div><a class="btn ghost" href="#/review">Review</a></div>`).join("") || '<p class="muted" style="margin-top:12px">Nothing waiting on you.</p>'}
      </div></div>`,

  studio: () => `
    <div class="head"><div><h1>Make something worth watching.</h1><p class="lead">A few choices, then the engine takes over.</p></div></div>
    <div class="steps">
      <div class="step done"><span class="n">1</span><div class="panel"><h2>Name your video</h2><p class="muted">You can change it later.</p><input class="field" id="vt" placeholder="e.g. Five money habits for a first salary" aria-label="Video name">
        <div style="margin-top:12px">${seg("kind", ["Reel", "Long-form", "Both"])}</div>
        <h2 style="margin-top:18px">Where it goes</h2><p class="muted">Pick the brand, then the pages that should get it.</p>
        ${WS.brands.length ? `<select class="field" id="sb" aria-label="Brand">${WS.brands.map((b) => `<option value="${b.id}"${b.id === WS.cur ? " selected" : ""}>${esc(b.name)}</option>`).join("")}</select><div class="socs" id="sp" style="margin-top:12px"></div>` : empty("Add a brand first, then pick its pages here.")}</div></div>
      <div class="step"><span class="n">2</span><div class="panel"><h2>Give it something to work with</h2><p class="muted">Start from footage you shot, or from a script the engine writes.</p>
        ${seg("src", ["Raw footage", "Meduza script"])}
        <input class="field" id="foot" style="margin-top:14px" placeholder="Link to your footage folder (Google Drive, Dropbox…), optional" aria-label="Footage link"></div></div>
      <div class="step"><span class="n">3</span><div class="panel"><h2>Show it what good looks like</h2><p class="muted">Paste a video you admire. Meduza studies how it's cut.</p>
        <input class="field" id="ref" placeholder="Link from YouTube, Instagram or TikTok, optional" aria-label="Reference video link"></div></div>
      <div class="step"><span class="n">4</span><div class="panel"><h2>Choose the look</h2><p class="muted">Each tile shows the recipe on the same clip.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">${seg("look", Object.keys(LOOKS))}<label style="display:flex;align-items:center;gap:10px">Captions ${seg("cap", ["On", "Off"])}</label></div>
        <div class="looks" id="looks">${looks("Overall style")}</div></div></div>
      <div class="step"><span class="n">5</span><div class="panel"><h2>Music</h2><p class="muted">Sits quietly under the voice.</p>${seg("music", ["None", "Auto", "Royalty-free library"], 1)}</div></div>
      <div class="step"><span class="n">6</span><div class="panel"><h2>Anything it should know?</h2><p class="muted">Optional. Mention a moment if it matters.</p>
        <textarea class="field" id="vn" placeholder="e.g. Keep the pace natural. End on a question, not a sales line."></textarea></div></div>
      <div class="step"><span class="n">7</span><div><button class="btn wide" id="make" type="button">Make my video</button>
        <p class="muted" style="margin-top:10px">It joins the queue. The engine picks it up as soon as it is connected to your server.</p></div></div>
    </div>`,

  editor: () => { const x = job(sessionStorage.getItem("meduzaJob")) || mine(JOBS())[0]?.[6];
    if (!x) return `<div class="head"><div><h1>Editor</h1><p class="lead">Open a video to see its details and tell the engine what to change.</p></div></div>${empty("No videos yet. Make one in Studio first.").replace("#/brands", "#/studio").replace("Go to Brands", "New video")}`;
    const b = B(x.b);
    return `
    <div class="head"><div><h1>${esc(x.t)}</h1><p class="lead">${esc(b?.name || "Removed brand")} · ${esc(x.kind)} · made ${ago(x.created)}</p></div><span class="chip ${CHIP[x.status]}">${LABEL[x.status]}</span></div>
    <div class="grid split" data-jid="${x.id}">
      <div class="panel"><h2>Details</h2><dl class="kvl">
        <dt>Goes to</dt><dd>${x.pages.map(([p, h]) => `${esc(p)} ${esc(h)}`).join(", ") || "No pages picked"}</dd>
        <dt>Start from</dt><dd>${esc(x.src)}${x.foot ? ` · <a href="${esc(x.foot)}" target="_blank" rel="noopener">footage</a>` : ""}</dd>
        <dt>Reference</dt><dd>${x.ref ? `<a href="${esc(x.ref)}" target="_blank" rel="noopener">${esc(x.ref)}</a>` : "None"}</dd>
        <dt>Look</dt><dd>${esc(x.look)} · captions ${esc(x.cap)} · music ${esc(x.music)}</dd></dl>
        <button type="button" class="btn ghost danger" data-act="del-job" style="margin-top:16px">Delete video</button></div>
      <div class="panel"><h2>Notes for the engine</h2><p class="muted">Say what to change. A time helps, e.g. "At 0:12, hold the chart longer."</p>
        <textarea class="field" id="jn" style="height:120px">${esc(x.notes)}</textarea>
        <button type="button" class="btn" data-act="save-notes" style="margin-top:10px">Save notes</button></div>
    </div>`; },

  videos: () => { const q = mine(JOBS()); return `
    <div class="head"><div><h1>Library</h1><p class="lead">Every video you've made, newest first.</p></div><div class="hctl">${picker()}</div></div>
    ${q.length ? `<div class="masonry">${q.map((it, i) => { const b = B(it[1]), tall = i % 3 !== 0;
      return `<a class="tile" href="#/editor" data-job="${it[6].id}" style="--a:${col(b)[0]}55;--b:${col(b)[1]};--ar:${tall ? "9/14" : "16/10"}"><span class="chip ${it[4]}">${it[5]}</span><b>${esc(it[0])}</b><small class="muted">${esc(b.name)}, ${it[3]}</small></a>`; }).join("")}</div>` : empty("No videos for " + esc(curName()) + " yet. Make one in Studio.").replace("#/brands", "#/studio").replace("Go to Brands", "New video")}`; },

  ideas: () => `
    <div class="head"><div><h1>Content ideas</h1><p class="lead">Ideas written by your AI for each brand, with the reason each might land.</p></div><div class="hctl">${picker()}<button class="btn" data-find>Find ideas with AI</button></div></div>
    ${mine(WS.ideas || []).length ? `<div class="grid g3">${mine(WS.ideas || []).map(([t, id, why]) =>
      `<div class="panel"><span class="chip" style="color:${col(B(id))[0]}">${esc(B(id).name)} · ${esc(B(id).niche)}</span><h2 style="margin:14px 0 8px;line-height:1.25">${esc(t)}</h2><p class="muted">${why}</p><button class="btn ghost" style="margin-top:16px" data-q="${esc(t)}" data-qb="${id}">Make this video</button></div>`).join("")}</div>`
      : empty("No ideas for " + esc(curName()) + " yet. Tap Find ideas with AI. It needs your server connected and an AI key in Admin.").replace("#/brands", "#/admin").replace("Go to Brands", "Open Admin")}`,

  analytics: () => `
    <div class="head"><div><h1>Analytics</h1><p class="lead">How long people stay, and where they leave.</p></div></div>
    ${empty("No numbers yet. They appear here once the engine is posting to your pages and reading their insights.").replace("#/brands", "#/admin").replace("Go to Brands", "Open Admin")}`,

  brands: () => { const niches = [...new Set(WS.brands.map((b) => b.niche))];
    return `
    <div class="head"><div><h1>Brands</h1><p class="lead">Every brand you run, in any niche, with all of its pages on every platform.</p></div><button class="btn" data-act="new">Add brand</button></div>
    <div id="bfh"></div>
    ${niches.length > 1 ? `<div class="chips" id="nf"><button class="chip on" data-n="">All niches</button>${niches.map((n) => `<button class="chip" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : ""}
    <div class="grid g2" id="bl">${WS.brands.map(brandCard).join("") || `<div class="emptyc"><p>No brands yet. Add your first one: any niche, any language.</p><button class="btn" data-act="new">Add brand</button></div>`}</div>`; },

  social: () => { const pl = byPlatform();
    return `
    <div class="head"><div><h1>Schedule</h1><p class="lead">What's scheduled where. Amber slots are waiting on approval.</p></div><div class="hctl">${picker()}<a class="btn ghost" href="#/review">Open review</a></div></div>
    ${pl.length ? `<div class="accts">${pl.map(([p, n]) => `<div class="panel"><span class="muted">${esc(p)}</span><b class="num">${n}</b><small class="muted">${n === 1 ? "page" : "pages"} connected</small></div>`).join("")}</div>
    <div class="panel"><h2>This week</h2><p class="muted" style="margin-top:6px">Nothing scheduled yet. Approved videos get a time slot here once the engine is posting. Where a platform has no posting API, Meduza prepares the file, caption and time for you to upload.</p></div>`
      : empty("No pages connected for " + esc(curName()) + " yet. Add pages to a brand to schedule posts.")}`; },

  review: () => `
    <div class="head"><div><h1>Review</h1><p class="lead">Nothing goes out until you approve it. Flagged items come first.</p></div>${picker()}</div>
    <div class="panel" id="rq">${mine(JOBS()).filter((r) => r[6].status === "review").map(([t, id, k, , , , x]) => `<div class="row" data-job="${x.id}">${sw(B(id))}
      <div class="grow"><div class="title">${esc(t)}</div><small>${esc(B(id).name)}, ${k.toLowerCase()}${x.flag ? ` · <span class="y">${esc(x.flag)}</span>` : ""}</small></div>
      <a class="btn ghost" href="#/editor">Open</a><button class="btn" data-ok>Approve</button></div>`).join("") || '<p class="muted">All caught up. Nothing waiting on you. Finished videos land here for your approval before anything goes out.</p>'}</div>`,

  admin: () => `
    <div class="head"><div><h1>Admin</h1><p class="lead">Connect your server, then add the keys Meduza uses. Keys go straight to your server and are stored there encrypted. They are never kept in this browser or in GitHub, and the site can't read them back.</p></div></div>
    <div class="panel" id="conn" style="margin-bottom:14px">${online ? `<div class="ph"><div><h2>Server connected</h2><p class="muted">${esc(SRV.url)}</p></div><button class="btn ghost" data-act="disconnect">Disconnect</button></div><div class="grid g4" id="sstat" style="margin-top:14px"></div>`
      : `<h2>Connect your server</h2><p class="muted">Paste the address and admin password the install command printed.</p>
      <form class="cform" data-act="connect"><input class="field" name="url" type="url" placeholder="https://… server address" required value="${esc(SRV?.url || "")}" aria-label="Server address"><input class="field" name="pass" type="password" placeholder="Admin password" required autocomplete="current-password" aria-label="Admin password"><button class="btn">Connect</button>
      <label class="rem"><input type="checkbox" name="rem" ${SRV?.rem ? "checked" : ""}> Remember on this device</label></form>
      <details class="how"><summary>No server yet? Set it up in one step</summary><ol>
        <li>In Hostinger hPanel open your VPS and click <b>Browser terminal</b> (or connect by SSH as root).</li>
        <li>Paste this and press Enter:<div class="codebox"><code id="cmd">${INSTALL}</code><button type="button" class="btn ghost" data-act="copy">Copy</button></div></li>
        <li>It prints a server address and an admin password. Paste them above.</li></ol>
        <p class="muted">Have a domain? Point a subdomain such as api.yourdomain.com to the VPS, then run the same command with <code>DOMAIN=api.yourdomain.com</code> before <code>bash</code> for a permanent address. Run the command again any time to update.</p></details>`}</div>
    <fieldset class="keys" ${online ? "" : "disabled"}>${online ? "" : '<p class="muted" style="margin:0 0 14px">Connect your server first. Keys are only ever sent to it.</p>'}
    ${KEYS.map(([g, list]) => `<div class="panel" style="margin-bottom:14px"><h2>${g}</h2>${list.map((k) => krow(...k)).join("")}</div>`).join("")}
    <div class="panel"><h2>Anything else</h2><p class="muted">Any other service: give it a name and paste its key.</p><div id="custom"></div>
      <form class="cform" data-act="add-custom" style="margin-top:12px"><input class="field" name="label" placeholder="Service name, e.g. Pika" required aria-label="Service name"><input class="field" type="password" name="key" placeholder="Paste key" autocomplete="off" required aria-label="Key"><button class="btn">Save</button></form></div>
    </fieldset>`,

  war: () => `
    <div class="head"><div><h1>War room</h1><p class="lead">The server, the pipeline and the money, on one screen.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/admin">Open control panel</a><a class="btn ghost" data-link="vpsRepo">Server repo</a><a class="btn ghost" data-link="engineRepo">Engine repo</a></div></div>
    <p class="muted" id="wnote" style="margin:-10px 0 14px">${online ? "Reading your server…" : "Server not connected."}</p>
    <div class="grid g3" id="rings" style="margin-bottom:16px">${online ? "" : empty("Connect your server in Admin to see its processor, memory and disk.").replace("#/brands", "#/admin").replace("Go to Brands", "Open Admin")}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Pipeline</h2><p class="muted">Your videos at each stage right now.</p>
      <div class="river">${Object.entries(LABEL).map(([k, n]) => `<div class="${k === "working" ? "busy" : k === "review" ? "hot" : ""}"><b class="num">${(WS.jobs || []).filter((x) => x.status === k).length}</b>${n}</div>`).join("")}</div></div>
    <div class="grid g2">
      <div class="panel"><h2>Services</h2><p class="muted">What Meduza runs on.</p>
        <div class="row"><i class="dot ${online ? "" : "off"}"></i><div class="grow"><div class="title">Meduza server</div></div><small>${online ? "Running" : "Not connected"}</small></div>
        <div class="row"><i class="dot off"></i><div class="grow"><div class="title">Engine (makes and posts the videos)</div></div><small>Not connected yet</small></div></div>
      <div class="panel"><h2>Needs attention</h2><p class="muted">What to do next.</p>
        ${[[!online, "Connect your server", "Admin, then paste the address and password", "#/admin"], [!WS.brands.length, "Add your first brand", "Brands, then add its pages", "#/brands"], [(WS.jobs || []).some((x) => x.status === "review"), "Videos waiting for approval", "Open Review", "#/review"]].filter((r) => r[0]).map(([, t, d, href]) => `<a class="row" href="${href}" style="text-decoration:none"><i class="dot amber"></i><div class="grow"><div class="title">${t}</div><small>${d}</small></div></a>`).join("") || '<p class="muted" style="margin-top:12px">Nothing right now.</p>'}</div>
    </div>`,
};

// ---------- motion ----------
let stop = () => {};
function segs() {
  $$(".seg").forEach((s) => { const pill = $(".pill", s), place = () => { const b = $("button.on", s); pill.style.width = b.offsetWidth + "px"; pill.style.transform = `translateX(${b.offsetLeft}px)`; };
    place(); s.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", s).forEach((o) => o.classList.toggle("on", o === b)); place();
      if (s.dataset.seg === "look") { $("#looks").innerHTML = looks(b.textContent); } }; });
}
function counts() {
  if (calm) return;
  $$("[data-count]").forEach((el) => { const end = +el.dataset.count, dec = el.dataset.count.includes(".") ? 2 : 0, t0 = performance.now();
    const tick = (now) => { const k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3); el.textContent = (end * e).toFixed(dec); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }
// Video finished: she winks, blows a kiss, and heart bubbles rise and pop.
function celebrate() {
  $(".finish")?.remove();
  const bubs = Array.from({ length: 14 }, (_, i) => `<i class="bub" style="left:${4 + ((i * 61) % 84)}%;top:${12 + ((i * 37) % 52)}%;--d:${22 + ((i * 13) % 30)}px;--t:${(1.2 + (i * .17) % 1.9).toFixed(2)}s"></i>`).join("");
  const d = document.createElement("div"); d.className = "finish";
  d.innerHTML = `<div class="card" role="dialog" aria-label="Video ready"><div class="bubbles">${bubs}</div>${medusa("kiss")}
    <h2>Your video is ready</h2><p>It's waiting for your approval in Review.</p>
    <div class="btns"><button class="btn" data-x>Watch it</button><a class="btn ghost" href="#/studio" data-x>Make another</a></div></div>`;
  d.onclick = (e) => { if (e.target === d || e.target.closest("[data-x]")) d.remove(); };
  document.body.append(d); $(".btn", d).focus();
  const m = $(".medusa", d);
  if (calm) mood(m, "hearts"); else { setTimeout(() => mood(m, "wink"), 250); setTimeout(() => mood(m, "hearts"), 1150); }
}
const HOOKS = {
  admin: () => {
    const host = $("main");
    const paint = (id, k) => { const row = $(`[data-k="${id}"]`); if (!row) return; const st = $(".kst", row);
      st.className = "kst " + (k?.test?.ok === true ? "ok" : k?.test?.ok === false ? "bad" : "muted");
      st.textContent = !k ? "Not set" : k.test ? `${k.test.note} · ••••${k.last4}` : `Saved ••••${k.last4}`;
      $$("[data-act=test],[data-act=rm]", row).forEach((b) => (b.hidden = !k)); $("input", row).placeholder = k ? "Paste a new key to replace it" : "Paste key"; };
    const refresh = async () => {
      if (!online) return;
      const [{ keys }, s] = await Promise.all([api("/api/keys"), api("/api/status")]);
      $("#custom").innerHTML = keys.filter((k) => k.id.startsWith("custom-")).map((k) => krow(k.id, k.label || k.id.slice(7), "Custom key")).join("");
      keys.forEach((k) => paint(k.id, k));
      $("#sstat").innerHTML = [["Keys saved", s.keys], ["Memory free", gb(s.mem.free)], ["Disk free", s.disk ? gb(s.disk.free) : "?"], ["Up for", Math.round(s.uptime / 3600) + " h"]].map(([l, v]) => `<div class="panel stat"><b class="num">${v}</b><span class="muted">${l}</span></div>`).join("");
    };
    refresh().catch((e) => toast(e.message));
    host.onclick = async (e) => {
      const t = e.target.closest("[data-act]"); if (!t) return; const id = t.closest("[data-k]")?.dataset.k;
      try {
        if (t.dataset.act === "disconnect") { SRV = null; online = false; try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); } catch {} srvPill(); go(); }
        else if (t.dataset.act === "copy") { navigator.clipboard.writeText(INSTALL).then(() => toast("Copied"), () => { const r = document.createRange(); r.selectNodeContents($("#cmd")); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Selected. Copy it with your keyboard."); }); }
        else if (t.dataset.act === "test") { $(".kst", t.closest("[data-k]")).textContent = "Testing…"; await api(`/api/keys/${id}/test`, { method: "POST" }); await refresh(); }
        else if (t.dataset.act === "rm") { if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Tap again"; setTimeout(() => { if (t.isConnected) { delete t.dataset.sure; t.textContent = "Remove"; } }, 3000); return; }
          await api(`/api/keys/${id}`, { method: "DELETE" }); toast("Key removed"); await refresh(); if (id.startsWith("custom-")) t.closest("[data-k]")?.remove(); else paint(id, null); }
      } catch (err) { toast(err.message); }
    };
    host.onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, v = (n) => f.elements[n]?.value.trim() || "", act = f.dataset.act;
      try {
        if (act === "connect") {
          SRV = { url: v("url").replace(/\/+$/, ""), pass: v("pass"), rem: f.elements.rem.checked };
          try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); (SRV.rem ? localStorage : sessionStorage).setItem(SKEY, JSON.stringify(SRV)); } catch {}
          if (await connect()) { toast("Connected to your server"); go(); }
        } else if (act === "save-key") {
          const id = f.closest("[data-k]").dataset.k; await api(`/api/keys/${id}`, { method: "PUT", body: { key: v("key") } }); f.reset(); toast("Saved. Testing it now…");
          await api(`/api/keys/${id}/test`, { method: "POST" }); await refresh();
        } else if (act === "add-custom") {
          const slug = v("label").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "key";
          await api(`/api/keys/custom-${slug}`, { method: "PUT", body: { key: v("key"), label: v("label") } }); f.reset(); toast("Saved"); await refresh();
        }
      } catch (err) { toast(err.message); }
    };
  },
  war: () => {
    if (!online) return;
    api("/api/status").then((s) => {
      const used = (t, f) => (t - f) / t;
      $("#rings").innerHTML = `<div class="panel">${ring(Math.min(1, s.load / s.cpus), `processor, ${s.cpus} cores`, Math.round(Math.min(1, s.load / s.cpus) * 100) + "%")}</div>`
        + `<div class="panel">${ring(used(s.mem.total, s.mem.free), "memory, of " + gb(s.mem.total), gb(s.mem.total - s.mem.free))}</div>`
        + (s.disk ? `<div class="panel">${ring(used(s.disk.total, s.disk.free), "disk, of " + gb(s.disk.total), gb(s.disk.total - s.disk.free), "var(--soft)")}</div>` : "");
      $("#wnote").textContent = "Live from your server.";
    }).catch((e) => toast(e.message));
  },
  ideas: () => {
    $("main").addEventListener("click", (e) => { const q = e.target.closest("[data-q]"); if (!q) return; const b = B(q.dataset.qb); if (!b) return;
      WS.jobs = [{ id: "v" + Date.now().toString(36), t: q.dataset.q, b: b.id, kind: "Reel", status: "queued", created: Date.now(), pages: b.pages, src: "Meduza script", foot: "", ref: "", look: "Overall style", cap: "On", music: "Auto", notes: "" }, ...(WS.jobs || [])];
      save(); toast("Queued for " + b.name); q.disabled = true; q.textContent = "Queued"; });
    const btn = $("[data-find]");
    btn.onclick = async () => {
      if (!online) return toast("Connect your server in Admin first, then add an AI key.");
      const b = WS.cur !== "all" && B(WS.cur) ? B(WS.cur) : WS.brands[0];
      if (!b) return toast("Add a brand first");
      btn.disabled = true; btn.textContent = `Thinking about ${b.name}…`;
      try {
        const r = await api("/api/ai/ideas", { method: "POST", body: { brand: { name: b.name, niche: b.niche, lang: b.lang, lane: b.lane } } });
        WS.ideas = [...r.ideas.map((x) => [x.title, b.id, x.why]), ...(WS.ideas || [])].slice(0, 60); save(); go(); toast(`${r.ideas.length} new ideas for ${b.name}`);
      } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = "Find ideas with AI"; }
    };
  },
  brands: () => {
    const host = $("main"), list = () => { $("#bl").innerHTML = WS.brands.map(brandCard).join(""); };
    const commit = () => { WS.sample = false; save(); go(); };
    const form = (b) => { $("#bfh").innerHTML = brandForm(b); $("#bf [name=name]").focus(); $("#bf").scrollIntoView({ block: "nearest" }); };
    host.onclick = (e) => {
      const t = e.target.closest("[data-act]"); if (!t) return; const act = t.dataset.act, card = t.closest("[data-b]"), b = card && B(card.dataset.b);
      if (act === "new") form();
      else if (act === "edit") form(b);
      else if (act === "cancel") $("#bfh").innerHTML = "";
      else if (act === "use") { WS.cur = b.id; save(); }
      else if (act === "rm-page") { b.pages.splice(+t.dataset.i, 1); commit(); }
      else if (act === "del") { if (t.dataset.sure) { WS.brands = WS.brands.filter((x) => x !== b); if (WS.cur === b.id) WS.cur = "all"; commit(); toast("Brand deleted"); }
        else { t.dataset.sure = "1"; t.textContent = "Tap again to delete"; setTimeout(() => { if (t.isConnected) { delete t.dataset.sure; t.textContent = "Delete"; } }, 3000); } }
    };
    host.onsubmit = (e) => {
      e.preventDefault(); const f = e.target, v = (n) => f.elements[n]?.value.trim() || "";
      if (f.id === "bf") {
        const old = B(f.dataset.id), data = { name: v("name"), niche: v("niche"), lang: v("lang"), lane: v("lane") };
        if (old) Object.assign(old, data); else WS.brands.push({ id: "b" + Date.now().toString(36), c: WS.brands.length % SWATCH.length, pages: [], ...data });
        commit(); toast(old ? "Brand saved" : "Brand added. Now add its pages.");
      } else if (f.dataset.act === "add-page") { B(f.closest("[data-b]").dataset.b).pages.push([v("p"), v("h")]); commit(); }
    };
    $("#nf")?.addEventListener("click", (e) => { const c = e.target.closest("[data-n]"); if (!c) return; $$("#nf .chip").forEach((x) => x.classList.toggle("on", x === c));
      $$("#bl [data-b]").forEach((card) => { card.hidden = !!c.dataset.n && B(card.dataset.b).niche !== c.dataset.n; }); });
  },
  review: () => {
    $("#rq").onclick = (e) => { const b = e.target.closest("[data-ok]"); if (!b) return; const x = job(b.closest("[data-job]").dataset.job); if (x) { x.status = "approved"; save(); } b.closest(".row").remove(); toast("Approved. It goes out in the next open slot.");
      if (!$("#rq .row")) $("#rq").innerHTML = '<p class="muted">All caught up. Nothing waiting on you.</p>'; };
  },
  studio: () => {
    const sb = $("#sb"), fill = () => { const b = B(sb.value); $("#sp").innerHTML = b.pages.map(([p, h], i) => `<label class="soc pick"><input type="checkbox" checked> <b>${esc(p)}</b><span>${esc(h)}</span></label>`).join("") || '<span class="muted">This brand has no pages yet. Add them on the Brands page.</span>'; };
    if (sb) { sb.onchange = fill; fill(); }
    const pick = (id) => $(`[data-seg="${id}"] button.on`)?.textContent || "";
    $("#make").onclick = () => {
      if (!sb) return toast("Add a brand first");
      const t = $("#vt").value.trim(); if (!t) { $("#vt").focus(); return toast("Give the video a name"); }
      const b = B(sb.value), on = $$("#sp input").map((c, i) => c.checked && b.pages[i]).filter(Boolean);
      if (!on.length) return toast("Pick at least one page");
      const x = { id: "v" + Date.now().toString(36), t, b: b.id, kind: pick("kind"), status: "queued", created: Date.now(), pages: on, src: pick("src"), foot: $("#foot").value.trim(), ref: $("#ref").value.trim(),
        look: $(".look.on b")?.textContent || pick("look"), cap: pick("cap"), music: pick("music"), notes: $("#vn").value.trim() };
      WS.jobs = [x, ...(WS.jobs || [])]; save(); sessionStorage.setItem("meduzaJob", x.id); toast("Queued. The engine starts it once it's connected."); location.hash = "#/editor";
    };
    $("#looks").onclick = (e) => { const l = e.target.closest(".look"); if (l) $$(".look").forEach((o) => o.classList.toggle("on", o === l)); };
  },
  editor: () => {
    $("main").onclick = (e) => { const t = e.target.closest("[data-act]"); if (!t) return; const x = job(t.closest("[data-jid]")?.dataset.jid); if (!x) return;
      if (t.dataset.act === "save-notes") { x.notes = $("#jn").value.trim(); save(); toast("Notes saved"); }
      if (t.dataset.act === "del-job") { if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Tap again to delete"; return; } WS.jobs = WS.jobs.filter((y) => y !== x); sessionStorage.removeItem("meduzaJob"); save(); toast("Video deleted"); location.hash = "#/videos"; } };
  },
};

// ---------- shell ----------
function go() {
  stop(); stop = () => {}; $(".finish")?.remove(); setMenu(false);
  const id = V[location.hash.slice(2)] ? location.hash.slice(2) : "home", main = $("main");
  main.innerHTML = V[id](); main.style.animation = "none"; void main.offsetWidth; main.style.animation = "";
  $$("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.id === id));
  scrollTo(0, 0); segs(); counts(); act(); HOOKS[id]?.();
  $$("[data-pick]").forEach((s) => (s.onchange = () => { WS.cur = s.value; save(); go(); }));
  $$("[data-job]").forEach((el) => el.addEventListener("click", () => sessionStorage.setItem("meduzaJob", el.dataset.job)));
  $$("[data-link]").forEach((a) => { const u = LINKS[a.dataset.link]; if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; } else a.onclick = () => toast("No address set for this yet"); });
  $$("[data-toast]").forEach((b) => (b.onclick = () => toast(b.dataset.toast)));
}
$("#nav").innerHTML = `<div class="ng"><a href="#/home" data-id="home">${ico("home")}Home</a></div>` + GROUPS.map(([g, , items]) =>
  `<div class="ng"><small>${g}</small>${items.map(([id, t]) => `<a href="#/${id}" data-id="${id}">${ico(id)}${t}</a>`).join("")}</div>`).join("");
function setMenu(open) { document.body.classList.toggle("menu-open", open); $("#menu").setAttribute("aria-expanded", String(open)); $("#scrim").hidden = !open; if (open) $("#nav a.on, #nav a")?.focus(); }
$("#menu").onclick = () => setMenu(!document.body.classList.contains("menu-open"));
$("#scrim").onclick = () => setMenu(false);
addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); $("#menu").focus(); } });
$("#motion").textContent = calm ? "Motion off" : "Motion on";
if (SRV) connect(true).then((ok) => ok && go());
$("#motion").onclick = () => { localStorage.setItem("meduzaMotion", calm ? "on" : "off"); location.reload(); };
addEventListener("pointermove", (e) => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); });
addEventListener("hashchange", go); document.fonts?.ready.then(go); go();
