// Meduza Studio — design preview. Everything on screen is sample data; nothing is wired to the engine yet.
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
};
const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[n]}"/></svg>`;
// Every page, grouped by what you are doing. Drives the sidebar and the home page.
const GROUPS = [
  ["Create", "Make videos from footage or a script.", [["studio", "New video", "A few choices, then the engine takes over"], ["editor", "Editor", "Pin a note to any moment"]]],
  ["Curate", "Pick what to make. Approve what goes out.", [["ideas", "Ideas", "Topics pulled from what is working"], ["review", "Review", "Approve or send back"], ["videos", "Library", "Everything finished"]]],
  ["Brands and socials", "Every brand, its pages and its schedule.", [["brands", "Brands", "Every brand and its pages"], ["social", "Schedule", "What posts where, and when"], ["analytics", "Analytics", "Where viewers stay or leave"]]],
  ["Run", "Server, pipeline and spend.", [["war", "War room", "Health and money on one screen"]]],
];
const PLATFORMS = ["Instagram", "Facebook", "YouTube", "TikTok", "X", "LinkedIn", "Threads", "Pinterest", "Bluesky", "Snapchat", "Website", "Other"];
const NICHES = ["Finance", "Beauty", "Fashion", "Fitness", "Food", "Sports", "Music", "Tech", "Gaming", "Education", "Travel", "Parenting", "Local business", "Real estate", "News", "Entertainment"];
const SWATCH = [["#ffd400", "#0f4a4a"], ["#ff9d6c", "#552413"], ["#8fb8ff", "#132a55"], ["#c6a4ff", "#2c1a55"], ["#ff5c8a", "#521327"], ["#b4f06a", "#2a4a10"], ["#6ce0ff", "#0d3d52"], ["#ffd9a0", "#4a3515"]];
// Sample workspace: a few brands in different niches, so the tool shows how it works before anyone adds their own.
const SAMPLE = () => ({ sample: true, cur: "all", brands: [
  { id: "b1", name: "TakaTalk", niche: "Finance", lang: "Bengali", lane: "First salary, first savings", c: 0, pages: [["Instagram", "@takatalk"], ["Facebook", "TakaTalk"], ["YouTube", "@takatalk"], ["TikTok", "@takatalk.bd"]] },
  { id: "b2", name: "GlowDesk", niche: "Beauty", lang: "English", lane: "Skincare on a student budget", c: 1, pages: [["Instagram", "@glowdesk"], ["Instagram", "@glowdesk.men"], ["TikTok", "@glowdesk"], ["Pinterest", "glowdesk"]] },
  { id: "b3", name: "Gully XI", niche: "Sports", lang: "Hindi", lane: "Cricket stats and fan takes", c: 2, pages: [["Instagram", "@gullyxi"], ["Facebook", "Gully XI"], ["YouTube", "@gullyxi"], ["X", "@gullyxi"]] },
  { id: "b4", name: "Spice Ledger", niche: "Food", lang: "Urdu", lane: "Ten-minute home recipes", c: 5, pages: [["Instagram", "@spiceledger"], ["Facebook", "Spice Ledger"], ["YouTube", "@spiceledger"]] },
  { id: "b5", name: "Night Shift FM", niche: "Music", lang: "English", lane: "New underground releases", c: 3, pages: [["Instagram", "@nightshift.fm"], ["TikTok", "@nightshiftfm"], ["YouTube", "@nightshiftfm"], ["Threads", "@nightshift.fm"]] },
  { id: "b6", name: "ByteBhai", niche: "Tech", lang: "Hindi", lane: "Phone and app tips", c: 6, pages: [["YouTube", "@bytebhai"], ["Instagram", "@bytebhai"], ["X", "@bytebhai"], ["LinkedIn", "ByteBhai"]] },
] });
const KEY = "meduzaWorkspace";
let WS;
try { WS = JSON.parse(localStorage.getItem(KEY)) || SAMPLE(); } catch { WS = SAMPLE(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(WS)); } catch {} };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const B = (id) => WS.brands.find((b) => b.id === id);
const col = (b) => SWATCH[(b?.c ?? 0) % SWATCH.length];
const sw = (b, s = "") => `<span class="swatch" style="${s}background:linear-gradient(150deg,${col(b)[0]},${col(b)[1]})"></span>`;
// Sample content belongs to sample brands; it disappears with them. Filtered by the brand picker.
const QUEUE = [
  ["জরুরি তহবিল: কত টাকা যথেষ্ট?", "b1", "Long-form", "9:42", "ready", "Ready"],
  ["Sunscreen under 500, tested", "b2", "Reel", "0:41", "review", "In review"],
  ["इस सीज़न के 5 सबसे तेज़ अर्धशतक", "b3", "Reel", "0:38", "cutting", "Cutting"],
  ["دس منٹ کی دال", "b4", "Reel", "0:44", "ready", "Ready"],
  ["Five releases you missed this week", "b5", "Long-form", "8:10", "", "Draft"],
  ["फ़ोन की बैटरी के 3 झूठ", "b6", "Reel", "0:36", "review", "In review"],
];
const REVIEW = [
  ["Sunscreen under 500, tested", "b2", "Reel", "A product claim has no source"],
  ["फ़ोन की बैटरी के 3 झूठ", "b6", "Reel", "Title reads as clickbait"],
  ["জরুরি তহবিল: কত টাকা যথেষ্ট?", "b1", "Long-form", ""],
  ["دس منٹ کی دال", "b4", "Reel", ""],
];
const IDEAS = [
  ["বেতনের প্রথম দিনে কী করবেন", "b1", "Salary week starts in 4 days"],
  ["Night routine in 3 steps", "b2", "Saved 1,900 times on a similar page"],
  ["Death-over economy, explained", "b3", "Final is in 6 days"],
  ["Iftar in 15 minutes", "b4", "Searches up 3x this week"],
  ["One beat, four ways", "b5", "Comments keep asking how"],
  ["UPI scam signs", "b6", "Asked 212 times in comments"],
];
const mine = (list) => list.filter((x) => B(x[1]) && (WS.cur === "all" || x[1] === WS.cur));
const curName = () => (WS.cur === "all" ? "all brands" : B(WS.cur)?.name || "all brands");
const picker = () => `<label class="wpick"><span class="muted">Showing</span><select class="field" data-pick><option value="all">All brands</option>${WS.brands.map((b) => `<option value="${b.id}"${b.id === WS.cur ? " selected" : ""}>${esc(b.name)}</option>`).join("")}</select></label>`;
const empty = (msg) => `<div class="emptyc"><p>${msg}</p><a class="btn ghost" href="#/brands">Go to Brands</a></div>`;
const rows = (list) => list.map(([t, id, k, d, s, l]) => `
  <div class="row">${sw(B(id))}
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
    <label>Name<input class="field" name="name" required value="${esc(b.name)}" placeholder="e.g. GlowDesk"></label>
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
        `<div class="panel stat"><b class="num" data-count="${n}">${n}</b><span class="muted">${l}</span><div style="margin-top:14px">${tide(18, i + 1)}</div></div>`).join("")}
    </div>
    <div class="grid split">
      <div class="panel"><div class="ph"><div><h2>Tonight's queue</h2><p class="muted">Waiting on the engine or on you.</p></div>${picker()}</div>${rows(mine(QUEUE)) || empty("Nothing queued for " + esc(curName()) + " yet.")}</div>
      <div class="panel"><h2>Waiting for your eye</h2><p class="muted">Flagged before anything goes out.</p>
        ${mine(REVIEW).filter((r) => r[3]).map(([t, id, , why]) => `<div class="row"><div class="grow"><div class="title">${why}</div><small>${esc(B(id).name)}, ${esc(t)}</small></div><a class="btn ghost" href="#/review">Review</a></div>`).join("") || '<p class="muted" style="margin-top:12px">Nothing flagged.</p>'}
      </div></div>`,

  studio: () => `
    <div class="head"><div><h1>Make something worth watching.</h1><p class="lead">A few choices, then the engine takes over.</p></div></div>
    <div class="steps">
      <div class="step done"><span class="n">1</span><div class="panel"><h2>Name your video</h2><p class="muted">You can change it later.</p><input class="field" value="${esc(mine(QUEUE)[0]?.[0] || "My first video")}" aria-label="Video name">
        <h2 style="margin-top:18px">Where it goes</h2><p class="muted">Pick the brand, then the pages that should get it.</p>
        ${WS.brands.length ? `<select class="field" id="sb" aria-label="Brand">${WS.brands.map((b) => `<option value="${b.id}"${b.id === WS.cur ? " selected" : ""}>${esc(b.name)}</option>`).join("")}</select><div class="socs" id="sp" style="margin-top:12px"></div>` : empty("Add a brand first, then pick its pages here.")}</div></div>
      <div class="step"><span class="n">2</span><div class="panel"><h2>Give it something to work with</h2><p class="muted">Start from footage you shot, or from a script the engine writes.</p>
        ${seg("src", ["Raw footage", "Meduza script"])}
        <div class="grid g2" style="margin-top:14px"><div class="drop"><b>Drop raw footage</b><span>or choose a file</span></div><div class="drop"><b>B-roll and photos</b><span>optional</span></div></div></div></div>
      <div class="step"><span class="n">3</span><div class="panel"><h2>Show it what good looks like</h2><p class="muted">Paste a video you admire. Meduza studies how it's cut.</p>
        <div style="display:flex;gap:10px"><input class="field" placeholder="Link from YouTube, Instagram or TikTok"><button class="btn" data-scan>Study it</button></div>
        <div id="scan" hidden style="margin-top:16px"><div style="display:flex;justify-content:space-between"><span>Studying the reference</span><b class="num" id="pct">0%</b></div>
          <div class="meter" style="margin:8px 0 10px"><i id="bar"></i></div>
          <ul class="scan">${["Fetching the video", "Speech pace and cuts", "Colour and sound", "Every word on screen", "Text styles and motion", "Typefaces", "Style kit"].map((s) => `<li>${s}</li>`).join("")}</ul></div></div></div>
      <div class="step"><span class="n">4</span><div class="panel"><h2>Choose the look</h2><p class="muted">Each tile shows the recipe on the same clip.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">${seg("look", Object.keys(LOOKS))}<label style="display:flex;align-items:center;gap:10px">Captions ${seg("cap", ["On", "Off"])}</label></div>
        <div class="looks" id="looks">${looks("Overall style")}</div></div></div>
      <div class="step"><span class="n">5</span><div class="panel"><h2>Music</h2><p class="muted">Sits quietly under the voice.</p>${seg("music", ["None", "Auto", "Library", "Upload"], 2)}
        ${[["Low tide", "Calm, piano", "2:14"], ["Market morning", "Light, percussive", "1:58"], ["Paper lanterns", "Warm, strings", "2:31"]].map(([t, d, l]) =>
          `<div class="row"><div class="grow"><div class="title">${t}</div><small>${d}</small></div>${wave()}<span class="num muted">${l}</span><button class="btn ghost">Use</button></div>`).join("")}</div></div>
      <div class="step"><span class="n">6</span><div class="panel"><h2>Anything it should know?</h2><p class="muted">Optional. Mention a moment if it matters.</p>
        <textarea class="field" placeholder="Keep the pace natural. At 0:12, show the savings chart. End on the question, not on a call to action."></textarea></div></div>
      <div class="step"><span class="n">7</span><div><div class="panel" style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><input class="field" placeholder="Save these choices as a preset, e.g. Calm and clear"><button class="btn ghost" data-toast="Preset saved">Save</button></div>
        <a class="btn wide" id="make" href="#/editor">Make my video</a></div></div>
    </div>`,

  editor: () => `
    <div class="head"><div><h2>${esc(mine(QUEUE)[0]?.[0] || "My first video")}</h2><p class="muted">${esc(B(mine(QUEUE)[0]?.[1])?.name || WS.brands[0]?.name || "Your brand")}, reel, version 2</p></div><span class="chip cutting" id="work"><i class="dot sting"></i>Working for 3m 17s</span></div>
    <div class="grid split">
      <div class="stage"><div class="top"><div class="device"><div class="screen" id="screen"><span class="cap">মাসে <em>৩ হাজার</em> টাকা জমালে</span></div></div>
        <ul class="layers"><li class="live">Footage</li><li class="live">Cuts</li><li class="live">Captions</li><li>Graphics</li><li>Colour and sound</li></ul></div>
        <div class="timeline" id="tl">
          ${[["Footage", [[0, 22], [23, 30], [54, 46]], "#4a4e55"], ["Captions", [[4, 14], [20, 26], [50, 18], [72, 22]], "#ffd400"], ["Graphics", [[30, 12], [62, 16]], "#f7f7f8"], ["B-roll", [[12, 10], [44, 9], [80, 12]], "#8b8f97"], ["Sound", [[0, 100]], "#2a2c30"]].map(([n, c, col]) =>
            `<div class="lane"><span>${n}</span><div class="track">${c.map(([l, w]) => `<i class="clip" style="left:${l}%;width:${w}%;--c:${col}"></i>`).join("")}</div></div>`).join("")}
          <span class="playhead" id="ph"></span></div></div>
      <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="tc num" id="tc">0:10.50</span><span class="muted num" id="fr">Frame 315</span></div>
        <p class="muted" style="margin:6px 0 14px">Drag the timeline to a moment, then say what should change.</p>
        <textarea class="field" id="fb" style="height:84px" placeholder="What should change here?"></textarea>
        <div style="display:flex;gap:10px;margin-top:10px"><button class="btn ghost" id="add">Add note</button><button class="btn" id="render">Update the video</button></div>
        <div id="notes"><div class="note"><time>0:07.03</time><span>Hold the figure a beat longer</span></div></div></div>
    </div>`,

  videos: () => { const q = mine(QUEUE); return `
    <div class="head"><div><h1>Library</h1><p class="lead">Everything the engine has finished, newest first.</p></div><div class="hctl">${picker()}${seg("vf", ["All", "Long-form", "Reels", "In review"])}</div></div>
    ${q.length ? `<div class="masonry">${Array.from({ length: Math.max(q.length, 8) }, (_, i) => { const it = q[i % q.length], b = B(it[1]), tall = i % 3 !== 0;
      return `<a class="tile" href="#/editor" style="--a:${col(b)[0]}55;--b:${col(b)[1]};--ar:${tall ? "9/14" : "16/10"}"><span class="chip ${it[4]}">${it[5]}</span><b>${esc(it[0])}</b><small class="muted">${esc(b.name)}, ${it[3]}</small></a>`; }).join("")}</div>` : empty("No finished videos for " + esc(curName()) + " yet.")}`; },

  ideas: () => `
    <div class="head"><div><h1>Content ideas</h1><p class="lead">Topics the research stage found for each brand, with the reason each might land.</p></div><div class="hctl">${picker()}<button class="btn" data-toast="Research queued for tonight">Find more</button></div></div>
    ${mine(IDEAS).length ? `<div class="grid g3">${mine(IDEAS).map(([t, id, why]) =>
      `<div class="panel"><span class="chip" style="color:${col(B(id))[0]}">${esc(B(id).name)} · ${esc(B(id).niche)}</span><h2 style="margin:14px 0 8px;line-height:1.25">${esc(t)}</h2><p class="muted">${why}</p><button class="btn ghost" style="margin-top:16px" data-toast="Added to the queue">Send to queue</button></div>`).join("")}</div>`
      : empty("No ideas for " + esc(curName()) + " yet. Research fills this once the brand's pages are connected to the engine.")}`,

  analytics: () => `
    <div class="head"><div><h1>Analytics</h1><p class="lead">How long people stay, and where they leave.</p></div>${seg("ar", ["7 days", "28 days", "90 days"], 1)}</div>
    <div class="grid split"><div class="panel"><h2>Viewers still watching</h2><p class="muted">Average across all reels. The dip at 0:06 is the hook handing over.</p>
      <svg class="curve" viewBox="0 0 600 220" style="width:100%"><path class="area" d="M0 20 C60 30 90 90 140 96 S260 110 340 128 S480 150 600 176 V220 H0z"/><path d="M0 20 C60 30 90 90 140 96 S260 110 340 128 S480 150 600 176"/></svg></div>
      <div class="panel"><h2>Hooks that held</h2><p class="muted">Share of viewers past three seconds.</p>
      ${[["A number first", 78], ["A question", 71], ["A small story", 66], ["A warning", 52]].map(([n, v]) => `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between"><span>${n}</span><b class="num">${v}%</b></div><div class="meter" style="margin-top:6px"><i style="--v:${v}%"></i></div></div>`).join("")}</div></div>`,

  brands: () => { const niches = [...new Set(WS.brands.map((b) => b.niche))];
    return `
    <div class="head"><div><h1>Brands</h1><p class="lead">Every brand you run, in any niche, with all of its pages on every platform.</p></div><button class="btn" data-act="new">Add brand</button></div>
    ${WS.sample ? `<div class="panel note-bar"><span>This is a sample workspace so you can see how it works. Your brands are saved in this browser.</span><button class="btn ghost" data-act="fresh">Start empty</button></div>` : ""}
    <div id="bfh"></div>
    ${niches.length > 1 ? `<div class="chips" id="nf"><button class="chip on" data-n="">All niches</button>${niches.map((n) => `<button class="chip" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : ""}
    <div class="grid g2" id="bl">${WS.brands.map(brandCard).join("") || `<div class="emptyc"><p>No brands yet. Add your first one: any niche, any language.</p><button class="btn" data-act="new">Add brand</button> <button class="btn ghost" data-act="sample">Load the sample</button></div>`}</div>`; },

  social: () => { const pl = byPlatform();
    return `
    <div class="head"><div><h1>Schedule</h1><p class="lead">What's scheduled where. Amber slots are waiting on approval.</p></div><div class="hctl">${picker()}<a class="btn ghost" href="#/review">Open review</a></div></div>
    ${pl.length ? `<div class="accts">${pl.map(([p, n]) => `<div class="panel"><span class="muted">${esc(p)}</span><b class="num">${n}</b><small class="muted">${n === 1 ? "page" : "pages"} connected</small></div>`).join("")}</div>
    <div class="panel"><div class="slots"><span></span>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}
      ${pl.slice(0, 8).map(([p], r) => `<span style="color:var(--ink)">${esc(p)}</span>${Array.from({ length: 7 }, (_, c) => `<i class="${(r * 3 + c * 5) % 7 < 4 ? "f" : (r + c) % 5 === 0 ? "h" : ""}"></i>`).join("")}`).join("")}</div>
      <p class="muted" style="margin-top:16px">Where a platform has no posting API, Meduza prepares the file, caption and time for you to upload.</p></div>`
      : empty("No pages connected for " + esc(curName()) + " yet. Add pages to a brand to schedule posts.")}`; },

  review: () => `
    <div class="head"><div><h1>Review</h1><p class="lead">Nothing goes out until you approve it. Flagged items come first.</p></div>${picker()}</div>
    <div class="panel" id="rq">${mine(REVIEW).map(([t, id, k, why]) => `<div class="row">${sw(B(id))}
      <div class="grow"><div class="title">${esc(t)}</div><small>${esc(B(id).name)}, ${k.toLowerCase()}${why ? ` · <span class="y">${why}</span>` : ""}</small></div>
      <a class="btn ghost" href="#/editor">Open</a><button class="btn" data-ok>Approve</button></div>`).join("") || '<p class="muted">All caught up. Nothing waiting on you.</p>'}</div>`,

  war: () => `
    <div class="head"><div><h1>War room</h1><p class="lead">The server, the pipeline and the money, on one screen.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" data-link="panel">Open control panel</a><a class="btn ghost" data-link="vpsRepo">Server repo</a><a class="btn ghost" data-link="engineRepo">Engine repo</a></div></div>
    <div class="grid g3" style="margin-bottom:16px"><div class="panel">${ring(.31, "processor, 2 cores", "31%")}</div><div class="panel">${ring(.58, "memory, of 8 GB", "4.6 GB")}</div><div class="panel">${ring(.74, "disk, of 100 GB", "74 GB", "var(--soft)")}</div></div>
    <div class="panel" style="margin-bottom:16px"><h2>Pipeline</h2><p class="muted">Items at each stage right now.</p>
      <div class="river">${[["Research", 2], ["Evidence", 1], ["Script", 3, "busy"], ["Fact-check", 2, "hot"], ["Voice", 0], ["Render", 1, "busy"], ["Reels", 4], ["Package", 0], ["Approval", 5]].map(([n, c, k = ""]) => `<div class="${k}"><b class="num">${c}</b>${n}</div>`).join("")}</div></div>
    <div class="grid g3">
      <div class="panel"><h2>Services</h2><p class="muted">On the server.</p>${[["Postiz", "Publishing", ""], ["Temporal", "Job runner", ""], ["Postgres", "Database", ""], ["Redis", "Queue", ""], ["n8n", "Paused", "amber"]].map(([n, d, c]) => `<div class="row"><i class="dot ${c}"></i><div class="grow"><div class="title">${n}</div></div><small>${d}</small></div>`).join("")}</div>
      <div class="panel"><h2>Spend this month</h2><p class="muted">Hard stop at 18 dollars.</p><b class="num" style="font:650 2.6rem var(--display)">$<span data-count="7.40">7.40</span></b>
        <div class="meter" style="margin:14px 0 8px"><i style="--v:37%"></i></div><small class="muted">Scripts 4.10, fact-check 1.70, search 1.20, the rest 0.40</small></div>
      <div class="panel"><h2>Needs attention</h2><p class="muted">Newest first.</p>
        ${[["Disk passes 70%", "Old renders can be cleared", "amber"], ["Fact-check flagged 2 items", "Waiting in the editor", "sting"], ["Nightly run finished", "5 of 5 items, 01:42", ""]].map(([t, d, c]) => `<div class="row"><i class="dot ${c}"></i><div class="grow"><div class="title">${t}</div><small>${d}</small></div></div>`).join("")}</div>
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
    <h2>Your video is ready</h2><p>Version 3 of ${esc(mine(QUEUE)[0]?.[0] || "your video")}.</p>
    <div class="btns"><button class="btn" data-x>Watch it</button><a class="btn ghost" href="#/studio" data-x>Make another</a></div></div>`;
  d.onclick = (e) => { if (e.target === d || e.target.closest("[data-x]")) d.remove(); };
  document.body.append(d); $(".btn", d).focus();
  const m = $(".medusa", d);
  if (calm) mood(m, "hearts"); else { setTimeout(() => mood(m, "wink"), 250); setTimeout(() => mood(m, "hearts"), 1150); }
}
const HOOKS = {
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
      else if (act === "fresh") { WS = { sample: false, cur: "all", brands: [] }; save(); go(); }
      else if (act === "sample") { WS = SAMPLE(); save(); go(); }
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
    $("#rq").onclick = (e) => { const b = e.target.closest("[data-ok]"); if (!b) return; b.closest(".row").remove(); toast("Approved. It goes out in the next open slot.");
      if (!$("#rq .row")) $("#rq").innerHTML = '<p class="muted">All caught up. Nothing waiting on you.</p>'; };
  },
  studio: () => {
    const sb = $("#sb"), fill = () => { const b = B(sb.value); $("#sp").innerHTML = b.pages.map(([p, h], i) => `<label class="soc pick"><input type="checkbox" checked> <b>${esc(p)}</b><span>${esc(h)}</span></label>`).join("") || '<span class="muted">This brand has no pages yet. Add them on the Brands page.</span>'; };
    if (sb) { sb.onchange = fill; fill(); }
    $("#make").onclick = () => sessionStorage.setItem("meduzaFresh", "1");
    $("[data-scan]").onclick = () => { const box = $("#scan"), li = $$(".scan li"); box.hidden = false; let p = 0; li.forEach((l) => l.classList.remove("ok"));
      const id = setInterval(() => { p = Math.min(100, p + 3); $("#pct").textContent = p + "%"; $("#bar").style.setProperty("--v", p + "%"); li.forEach((l, i) => l.classList.toggle("ok", p >= (i + 1) * 14)); if (p === 100) clearInterval(id); }, 90); stop = () => clearInterval(id); };
    $("#looks").onclick = (e) => { const l = e.target.closest(".look"); if (l) $$(".look").forEach((o) => o.classList.toggle("on", o === l)); };
  },
  editor: () => {
    const tl = $("#tl"), ph = $("#ph"), len = 35; let p = .3, drag = false, raf;
    const set = (v) => { p = Math.max(0, Math.min(1, v)); ph.style.setProperty("--p", p); $("#screen").style.setProperty("--px", 20 + p * 60 + "%");
      const s = p * len; $("#tc").textContent = `0:${s.toFixed(2).padStart(5, "0")}`; $("#fr").textContent = "Frame " + Math.round(s * 30); };
    const at = (e) => { const r = $(".track", tl).getBoundingClientRect(); set((e.clientX - r.left) / r.width); };
    tl.onpointerdown = (e) => { drag = true; tl.setPointerCapture(e.pointerId); at(e); }; tl.onpointermove = (e) => drag && at(e); tl.onpointerup = () => (drag = false);
    const play = () => { if (!drag) set(p >= 1 ? 0 : p + .0009); raf = requestAnimationFrame(play); }; set(p); if (!calm) play();
    $("#add").onclick = () => { const f = $("#fb"); if (!f.value.trim()) return f.focus(); const n = document.createElement("div"); n.className = "note";
      n.innerHTML = `<time>${$("#tc").textContent}</time><span></span>`; n.lastChild.textContent = f.value.trim(); $("#notes").prepend(n); f.value = ""; };
    let timer; const work = $("#work");
    const render = () => { clearTimeout(timer); work.className = "chip cutting"; work.innerHTML = '<i class="dot sting"></i>Rendering version 3';
      timer = setTimeout(() => { work.className = "chip ready"; work.textContent = "Version 3 ready"; celebrate(); }, 2200); };
    $("#render").onclick = render;
    if (sessionStorage.getItem("meduzaFresh")) { sessionStorage.removeItem("meduzaFresh"); render(); }
    stop = () => { cancelAnimationFrame(raf); clearTimeout(timer); };
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
$("#motion").onclick = () => { localStorage.setItem("meduzaMotion", calm ? "on" : "off"); location.reload(); };
addEventListener("pointermove", (e) => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); });
addEventListener("hashchange", go); document.fonts?.ready.then(go); go();
