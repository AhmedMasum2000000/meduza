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
  ["Brands and socials", "Every brand, its pages and its schedule.", [["brands", "Brands", "Ten voices and their pages"], ["social", "Schedule", "What posts where, and when"], ["analytics", "Analytics", "Where viewers stay or leave"]]],
  ["Run", "Server, pipeline and spend.", [["war", "War room", "Health and money on one screen"]]],
];
const SOC = [["Instagram", 1], ["Facebook", 1], ["YouTube", 1], ["TikTok", 0]]; // TikTok only for Bangladesh brands: it is banned in India
const REVIEW = [
  ["SIP शुरू करने से पहले ये जान लें", "MoneyAaj", "Reel", "A rate has no official source"],
  ["EMI का असली खर्च", "RupeeLogic", "Reel", "Title reads as advice, not explanation"],
  ["জরুরি তহবিল: কত টাকা যথেষ্ট?", "TakaTalk", "Long-form", ""],
  ["সঞ্চয়পত্রের মুনাফা কীভাবে হিসাব হয়", "SonchoyGhor", "Reel", ""],
];

const BRANDS = [
  ["TakaTalk", "Bengali", "First salary, first savings", "#ffd400", "#0f4a4a"],
  ["MoneyAaj", "Hindi", "Daily money news, explained", "#f2c14e", "#4a3410"],
  ["RupeeLogic", "Hindi", "The maths behind money choices", "#8fb8ff", "#132a55"],
  ["NiveshPath", "Hindi", "Long-term investing basics", "#c6a4ff", "#2c1a55"],
  ["SonchoyGhor", "Bengali", "Household saving habits", "#ff9d6c", "#552413"],
  ["PaisaPoint", "Hindi", "Banking and cards", "#6ce0ff", "#0d3d52"],
  ["TakaTori", "Bengali", "Mobile wallets and transfers", "#ff5c8a", "#521327"],
  ["BachatBuddy", "Hindi", "Budgeting for students", "#b4f06a", "#2a4a10"],
  ["ArthoKotha", "Bengali", "Economy in plain words", "#ffd9a0", "#4a3515"],
  ["KharchaClub", "Hindi", "Spending smarter", "#9af0e0", "#12443c"],
];
const QUEUE = [
  ["জরুরি তহবিল: কত টাকা যথেষ্ট?", "TakaTalk", "Long-form", "9:42", "ready", "Ready"],
  ["SIP शुरू करने से पहले ये जान लें", "MoneyAaj", "Reel", "0:41", "review", "In review"],
  ["সঞ্চয়পত্রের মুনাফা কীভাবে হিসাব হয়", "SonchoyGhor", "Reel", "0:38", "cutting", "Cutting"],
  ["PPF बनाम FD: फर्क कहाँ है?", "NiveshPath", "Long-form", "10:15", "", "Draft"],
  ["EMI का असली खर्च", "RupeeLogic", "Reel", "0:44", "ready", "Ready"],
];
const brand = (n) => BRANDS.find((b) => b[0] === n) || BRANDS[0];
const rows = (list) => list.map(([t, b, k, d, s, l]) => `
  <div class="row"><span class="swatch" style="background:linear-gradient(150deg,${brand(b)[3]},${brand(b)[4]})"></span>
  <div class="grow"><div class="title">${t}</div><small>${b}, ${k.toLowerCase()}</small></div>
  <span class="num muted">${d}</span><span class="chip ${s}">${s === "cutting" ? '<i class="dot sting"></i>' : ""}${l}</span></div>`).join("");
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
      <a class="feature" href="#/brands"><div class="shot a4"></div><h2>Brands</h2><p>Ten voices that never sound alike</p></a>
    </div>
    <div class="promo-row">
      <section class="promo"><div class="frame">${medusa("act")}</div>
        <div class="copy"><h1>Ten brands.<br>One engine.<br><span class="y">Yours to approve.</span></h1>
        <p class="lead">Meduza writes, voices, cuts and packages. Nothing goes out until you say so.</p>
        <a class="btn" href="#/studio">Start a new cut</a></div></section>
      <div class="hub">${GROUPS.map(([g, d, items]) => `<section class="hubc"><h2>${g}</h2><p class="muted">${d}</p>
        <div class="hubl">${items.map(([id, t, s]) => `<a href="#/${id}">${ico(id)}<span><b>${t}</b><small>${s}</small></span></a>`).join("")}</div></section>`).join("")}</div>
    </div>
    <div class="grid g4" style="margin-bottom:14px">
      ${[["10", "brands"], ["30", "long-form this month"], ["300", "reels this month"], ["7.40", "dollars spent of 20"]].map(([n, l], i) =>
        `<div class="panel stat"><b class="num" data-count="${n}">${n}</b><span class="muted">${l}</span><div style="margin-top:14px">${tide(18, i + 1)}</div></div>`).join("")}
    </div>
    <div class="grid split">
      <div class="panel"><h2>Tonight's queue</h2><p class="muted">Five items waiting on the engine or on you.</p>${rows(QUEUE)}</div>
      <div class="panel"><h2>Waiting for your eye</h2><p class="muted">Two flagged by the fact-check.</p>
        <div class="row"><div class="grow"><div class="title">A rate has no official source</div><small>MoneyAaj, scene 4</small></div><a class="btn ghost" href="#/editor">Review</a></div>
        <div class="row"><div class="grow"><div class="title">Reads as advice, not explanation</div><small>RupeeLogic, title</small></div><a class="btn ghost" href="#/editor">Review</a></div>
      </div></div>`,

  studio: () => `
    <div class="head"><div><h1>Make something worth watching.</h1><p class="lead">A few choices, then the engine takes over.</p></div></div>
    <div class="steps">
      <div class="step done"><span class="n">1</span><div class="panel"><h2>Name your video</h2><p class="muted">You can change it later.</p><input class="field" value="Emergency fund explainer"></div></div>
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
    <div class="head"><div><h2>Emergency fund explainer</h2><p class="muted">TakaTalk, reel, version 2</p></div><span class="chip cutting" id="work"><i class="dot sting"></i>Working for 3m 17s</span></div>
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

  videos: () => `
    <div class="head"><div><h1>My videos</h1><p class="lead">Everything the engine has finished, newest first.</p></div>${seg("vf", ["All", "Long-form", "Reels", "In review"])}</div>
    <div class="masonry">${Array.from({ length: 12 }, (_, i) => { const q = QUEUE[i % 5], b = brand(q[1]), tall = i % 3 !== 0;
      return `<a class="tile" href="#/editor" style="--a:${b[3]}55;--b:${b[4]};--ar:${tall ? "9/14" : "16/10"}"><span class="chip ${q[4]}">${q[5]}</span><b>${q[0]}</b><small class="muted">${q[1]}, ${q[3]}</small></a>`; }).join("")}</div>`,

  ideas: () => `
    <div class="head"><div><h1>Content ideas</h1><p class="lead">Topics the research stage found, with the reason each might land.</p></div><button class="btn" data-toast="Research queued for tonight">Find more</button></div>
    <div class="grid g3">${[["বেতনের প্রথম দিনে কী করবেন", "TakaTalk", "Salary week starts in 4 days"], ["क्रेडिट कार्ड का न्यूनतम भुगतान", "PaisaPoint", "Asked 212 times in comments"], ["Festival bonus: save or spend?", "KharchaClub", "Festival season, 3 weeks out"], ["মোবাইল ওয়ালেটের খরচ", "TakaTori", "A rival's video on this held 71%"], ["टैक्स बचाने की आखिरी तारीख", "MoneyAaj", "Deadline in 23 days"], ["মূল্যস্ফীতি মানে কী", "ArthoKotha", "New official figures out"]].map(([t, b, why]) =>
      `<div class="panel"><span class="chip" style="color:${brand(b)[3]}">${b}</span><h2 style="margin:14px 0 8px;line-height:1.25">${t}</h2><p class="muted">${why}</p><button class="btn ghost" style="margin-top:16px" data-toast="Added to the queue">Send to queue</button></div>`).join("")}</div>`,

  analytics: () => `
    <div class="head"><div><h1>Analytics</h1><p class="lead">How long people stay, and where they leave.</p></div>${seg("ar", ["7 days", "28 days", "90 days"], 1)}</div>
    <div class="grid split"><div class="panel"><h2>Viewers still watching</h2><p class="muted">Average across all reels. The dip at 0:06 is the hook handing over.</p>
      <svg class="curve" viewBox="0 0 600 220" style="width:100%"><path class="area" d="M0 20 C60 30 90 90 140 96 S260 110 340 128 S480 150 600 176 V220 H0z"/><path d="M0 20 C60 30 90 90 140 96 S260 110 340 128 S480 150 600 176"/></svg></div>
      <div class="panel"><h2>Hooks that held</h2><p class="muted">Share of viewers past three seconds.</p>
      ${[["A number first", 78], ["A question", 71], ["A small story", 66], ["A warning", 52]].map(([n, v]) => `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between"><span>${n}</span><b class="num">${v}%</b></div><div class="meter" style="margin-top:6px"><i style="--v:${v}%"></i></div></div>`).join("")}</div></div>`,

  brands: () => `
    <div class="head"><div><h1>Brands</h1><p class="lead">Ten voices that must never sound alike, and the pages each one runs.</p></div></div>
    <div class="grid g2">${BRANDS.map(([n, lang, lane, a, b], i) => `<div class="panel bcard">
      <span class="swatch" style="width:64px;height:64px;border-radius:18px;background:linear-gradient(150deg,${a},${b})"></span>
      <div><h2>${n}</h2><p class="muted">${lang}. ${lane}.</p></div><div style="width:110px">${tide(12, i + 2)}<small class="muted">this week</small></div>
      <div class="socs">${SOC.filter(([, all]) => all || lang === "Bengali").map(([p], k) => `<span class="soc"><b>${p}</b><span>${((((i * 37 + k * 53) % 90) + 10) / 10).toFixed(1)}k</span></span>`).join("")}</div>
      <div class="acts"><a class="btn ghost" href="#/studio">New video</a><a class="btn ghost" href="#/social">Schedule</a><a class="btn ghost" href="#/videos">Library</a></div></div>`).join("")}</div>`,

  social: () => `
    <div class="head"><div><h1>Schedule</h1><p class="lead">What's scheduled where. Amber slots are waiting on approval.</p></div><a class="btn ghost" href="#/review">Open review</a></div>
    <div class="accts">${[["Instagram", 10], ["Facebook", 10], ["YouTube", 10], ["TikTok", 4, "Bangladesh brands only"]].map(([p, n, note]) => `<div class="panel"><span class="muted">${p}</span><b class="num">${n}</b><small class="muted">${note || "pages connected"}</small></div>`).join("")}</div>
    <div class="panel"><div class="slots"><span></span>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}
      ${["YouTube", "Instagram", "Facebook", "LinkedIn", "TikTok"].map((p, r) => `<span style="color:var(--ink)">${p}</span>${Array.from({ length: 7 }, (_, c) => `<i class="${(r * 3 + c * 5) % 7 < 4 ? "f" : (r + c) % 5 === 0 ? "h" : ""}"></i>`).join("")}`).join("")}</div>
      <p class="muted" style="margin-top:16px">TikTok is posted by hand. Meduza prepares the file, caption and time.</p></div>`,

  review: () => `
    <div class="head"><div><h1>Review</h1><p class="lead">Nothing goes out until you approve it. Flagged items come first.</p></div></div>
    <div class="panel" id="rq">${REVIEW.map(([t, b, k, why]) => `<div class="row"><span class="swatch" style="background:linear-gradient(150deg,${brand(b)[3]},${brand(b)[4]})"></span>
      <div class="grow"><div class="title">${t}</div><small>${b}, ${k.toLowerCase()}${why ? ` · <span class="y">${why}</span>` : ""}</small></div>
      <a class="btn ghost" href="#/editor">Open</a><button class="btn" data-ok>Approve</button></div>`).join("")}</div>`,

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
    <h2>Your video is ready</h2><p>Version 3 of Emergency fund explainer.</p>
    <div class="btns"><button class="btn" data-x>Watch it</button><a class="btn ghost" href="#/studio" data-x>Make another</a></div></div>`;
  d.onclick = (e) => { if (e.target === d || e.target.closest("[data-x]")) d.remove(); };
  document.body.append(d); $(".btn", d).focus();
  const m = $(".medusa", d);
  if (calm) mood(m, "hearts"); else { setTimeout(() => mood(m, "wink"), 250); setTimeout(() => mood(m, "hearts"), 1150); }
}
const HOOKS = {
  review: () => {
    $("#rq").onclick = (e) => { const b = e.target.closest("[data-ok]"); if (!b) return; b.closest(".row").remove(); toast("Approved. It goes out in the next open slot.");
      if (!$("#rq .row")) $("#rq").innerHTML = '<p class="muted">All caught up. Nothing waiting on you.</p>'; };
  },
  studio: () => {
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
