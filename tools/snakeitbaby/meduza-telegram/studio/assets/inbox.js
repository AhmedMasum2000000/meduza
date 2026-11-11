function telegramInboxView() {
  return `
    <div class="head"><div><h1>Telegram inbox</h1><p class="lead">Download videos, audio, images, and attachments from your selected Telegram sources.</p></div></div>
    <div class="grid split">
      <section id="tg-controls" class="panel">
        <h2>Source</h2>
        <label for="tg-source" class="muted">Telegram channel or group</label>
        <select id="tg-source" class="field" style="margin:8px 0 14px" disabled>
          <option value="">Loading channels and groups…</option>
        </select>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" class="btn" id="tg-watch" disabled>Auto-download new files</button>
          <button type="button" class="btn ghost" id="tg-scan" disabled>Download today’s files</button>
          <button type="button" class="btn ghost" id="tg-history" disabled>Download all existing files</button>
          <button type="button" class="btn ghost" id="tg-refresh">Refresh sources</button>
        </div>
        <p id="tg-action" role="status" style="margin-top:16px"></p>
        <p id="tg-status" class="muted"></p>
        <p class="muted">Auto-download watches new posts. Use a download button to collect files already in the source.</p>
        <div id="tg-preview" hidden style="margin-top:20px">
          <p id="tg-preview-summary"></p>
          <ul id="tg-preview-files" style="overflow-wrap:anywhere"></ul>
          <button type="button" class="btn" id="tg-confirm">Start download</button>
          <button type="button" class="btn ghost" id="tg-cancel">Cancel</button>
        </div>
        <div id="tg-progress" hidden style="margin-top:20px">
          <p id="tg-progress-name" style="overflow-wrap:anywhere"></p>
          <progress id="tg-progress-bar" max="100" value="0" aria-label="File download progress" style="width:100%;height:18px;accent-color:#ffd400"></progress>
          <p id="tg-progress-detail" class="muted" aria-live="polite"></p>
        </div>
      </section>
      <section class="panel">
        <h2>Storage</h2>
        <p id="tg-storage" class="muted">Waiting for the local inbox…</p>
        <p id="tg-folder" style="overflow-wrap:anywhere"></p>
      </section>
    </div>
    <section class="panel" style="margin-top:14px">
      <h2>Downloaded files</h2>
      <div id="tg-files" class="muted">Saved files will appear here.</div>
    </section>`;
}

function connectTelegramInbox() {
  const panel = document.querySelector('#tg-controls');
  const source = panel.querySelector('#tg-source');
  const watch = panel.querySelector('#tg-watch');
  const scan = panel.querySelector('#tg-scan');
  const history = panel.querySelector('#tg-history');
  const refresh = panel.querySelector('#tg-refresh');
  const action = panel.querySelector('#tg-action');
  const status = panel.querySelector('#tg-status');
  const storage = document.querySelector('#tg-storage');
  const folder = document.querySelector('#tg-folder');
  const files = document.querySelector('#tg-files');
  const progressBox = panel.querySelector('#tg-progress');
  const progressName = panel.querySelector('#tg-progress-name');
  const progressBar = panel.querySelector('#tg-progress-bar');
  const progressDetail = panel.querySelector('#tg-progress-detail');
  const preview = panel.querySelector('#tg-preview');
  const previewSummary = panel.querySelector('#tg-preview-summary');
  const previewFiles = panel.querySelector('#tg-preview-files');
  const confirm = panel.querySelector('#tg-confirm');
  let pendingBatch;
  let state;
  let working = false;
  let checking = false;
  let active = true;

  function size(bytes) {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
    return `${Math.ceil(bytes / 1024)} KiB`;
  }

  async function api(route, payload) {
    const response = await fetch(`/api/${route}`, payload === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The local inbox did not respond.');
    return result;
  }

  function selection() {
    return state?.sources.find((item) => item.id === source.value);
  }

  function buttons() {
    const item = selection();
    watch.disabled = working || !item || (item.protected && !item.watch);
    watch.textContent = item?.watch ? 'Pause auto-download' : 'Auto-download new files';
    scan.disabled = working || !item || item.protected || state.busy;
    history.disabled = scan.disabled;
    confirm.disabled = working || state?.busy || !pendingBatch;
    refresh.disabled = working;
  }

  function display(next) {
    if (!active) return;
    state = next;
    const previous = source.value || state.sources.find((item) => item.watch)?.id || '';
    source.replaceChildren(new Option('Choose a channel or group', ''));
    for (const item of state.sources) {
      const label = item.protected ? ' · Saving restricted' : item.watch ? ' · Watching' : '';
      source.add(new Option(item.name + label, item.id));
    }
    source.value = state.sources.some((item) => item.id === previous) ? previous : '';
    source.disabled = working || !state.sources.length;
    status.textContent = state.note;
    const capLabel = state.cap == null ? 'No download cap' : `${size(state.cap)} inbox cap`;
    storage.textContent = `${size(state.used)} used · ${size(state.free)} free · ${capLabel}`;
    progressBox.hidden = !state.progress;
    if (state.progress) {
      const current = state.progress;
      const percent = current.total > 0 ? Math.min(100, 100 * current.received / current.total) : 0;
      progressName.textContent = current.name;
      progressBar.value = percent;
      const label = current.state === 'downloading' ? `${size(current.bytes_per_second)}/s` : current.state === 'complete' ? 'Saved' : 'Stopped';
      progressDetail.textContent = `${percent.toFixed(1)}% · ${size(current.received)} / ${size(current.total)} · ${label}`;
    }
    folder.textContent = state.folder;
    files.replaceChildren();
    if (!state.files.length) files.textContent = 'Saved files will appear here.';
    for (const item of state.files) {
      const row = document.createElement('div');
      row.className = 'row';
      const name = document.createElement('span');
      name.className = 'grow';
      name.style.overflowWrap = 'anywhere';
      name.textContent = item.name;
      const bytes = document.createElement('small');
      bytes.textContent = size(item.bytes);
      row.append(name, bytes);
      files.append(row);
    }
    buttons();
  }

  async function check() {
    if (working || checking) return;
    checking = true;
    try {
      const next = await api('status');
      if (!working) display(next);
    } catch {
      status.textContent = 'Open this copy through the local Python inbox to connect Telegram.';
    } finally {
      checking = false;
    }
  }

  async function run(task) {
    working = true;
    source.disabled = true;
    buttons();
    try {
      await task();
    } catch (error) {
      action.textContent = error.message;
    } finally {
      working = false;
      source.disabled = !state?.sources.length;
      buttons();
    }
  }

  source.onchange = () => { pendingBatch = undefined; preview.hidden = true; buttons(); };
  refresh.onclick = () => run(async () => {
    action.textContent = 'Refreshing Telegram sources…';
    display(await api('refresh', {}));
    action.textContent = 'Sources refreshed.';
  });
  watch.onclick = () => run(async () => {
    const item = selection();
    if (!item.watch && !window.confirm(`Automatically save new files from ${item.name}?\n\n${state.cap == null ? 'Downloads have no inbox size cap.' : `Inbox size cap: ${size(state.cap)}.`}`)) return;
    display(await api('watch', { source: item.id, enabled: !item.watch }));
    action.textContent = item.watch ? 'Auto-download paused.' : `Watching ${item.name} for new files.`;
  });
  function scanSource(scope) { return run(async () => {
    const item = selection();
    pendingBatch = undefined;
    preview.hidden = true;
    action.textContent = scope === 'all' ? 'Checking the full channel history…' : 'Checking today’s posts…';
    const batch = await api('scan', { source: item.id, scope });
    if (!active) return;
    const period = scope === 'all' ? 'all history' : `${batch.date} ${batch.timezone}`;
    const summary = `${batch.count} file(s) to download · ${size(batch.bytes)} · ${period}`;
    action.textContent = batch.count ? summary : scope === 'all' ? 'No unsaved files found in this source.' : 'No unsaved files today. Try Download all existing files for earlier posts.';
    if (!batch.count) return;
    if (!batch.fits) {
      action.textContent += ' · This batch needs more free disk space.';
      return;
    }
    pendingBatch = batch;
    previewSummary.textContent = `${item.name} · ${summary}`;
    previewFiles.replaceChildren();
    for (const name of batch.examples || []) {
      const row = document.createElement('li');
      row.textContent = name;
      previewFiles.append(row);
    }
    confirm.textContent = `Download ${batch.count} file(s)`;
    preview.hidden = false;
  }); }
  scan.onclick = () => scanSource('today');
  history.onclick = () => scanSource('all');
  panel.querySelector('#tg-cancel').onclick = () => {
    pendingBatch = undefined;
    preview.hidden = true;
    buttons();
  };
  confirm.onclick = () => run(async () => {
    if (!pendingBatch) return;
    display(await api('download', { token: pendingBatch.token }));
    pendingBatch = undefined;
    preview.hidden = true;
    action.textContent = 'Batch confirmed. Check the inbox status below.';
  });
  check();
  const timer = setInterval(check, 1000);
  return () => { active = false; clearInterval(timer); };
}
