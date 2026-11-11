function mediaWorkspaceView() {
  return `<div class="head"><div><h1>Your media workspace</h1><p class="lead">Find footage, build an edit, and return to your finished exports.</p></div><a class="btn" href="http://127.0.0.1:18470/projects">Open snakeitbaby editor</a></div>
    <div id="workspace-counts" class="grid g3" style="margin-bottom:20px"></div>
    <div class="grid g3"><a class="panel media-workflow" href="#/studio"><span class="media-step">01</span><h2>Find your footage</h2><p>Browse C:\\MEDUSA\\assets, Telegram downloads, and configured locations.</p></a>
    <a class="panel media-workflow" href="http://127.0.0.1:18470/projects"><span class="media-step">02</span><h2>Edit in snakeitbaby</h2><p>Arrange clips on the timeline, trim, add sound and text, then export.</p></a>
    <a class="panel media-workflow" href="#/videos"><span class="media-step">03</span><h2>Review exports</h2><p>Play completed edits saved back into your Meduza library.</p></a></div>
    <section class="panel" style="margin-top:20px"><h2>Connected sources</h2><div id="workspace-sources"></div><p id="workspace-message" role="status"></p></section>
    <section class="panel" style="margin-top:20px"><h2>Live activity</h2><p id="workspace-engine" role="status">Checking editor…</p><p id="workspace-telegram">Checking Telegram…</p><p id="workspace-download"></p><progress id="workspace-progress" hidden max="100" aria-label="Current Telegram download" style="width:100%"></progress><small id="workspace-checked" class="muted"></small></section>`;
}

function mediaLibraryView(exportsOnly = false) {
  return `<div class="head"><div><h1>${exportsOnly ? 'Finished exports' : 'Media library'}</h1><p class="lead">${exportsOnly ? 'Review edits saved from snakeitbaby.' : 'Use files from your PC, Telegram inbox, or a configured folder or download link.'}</p></div><a class="btn ghost" href="http://127.0.0.1:18470/projects">snakeitbaby projects</a></div>
  <div class="media-toolbar"><button class="btn" id="media-pick">Import from PC</button><input id="media-upload" type="file" accept="video/*,audio/*,image/*" multiple hidden><button class="btn ghost" id="media-refresh">Refresh library</button><span id="media-summary" class="muted"></span></div>
  <div class="media-layout"><aside class="panel media-sidebar"><h2>Locations</h2><div id="media-sources"></div>
    <details><summary>Add a folder</summary><form id="media-folder-form"><label>Name<input class="field" name="name" placeholder="My footage"></label><label>Folder or network path<input class="field" name="path" placeholder="C:\\MEDUSA\\assets" required></label><button class="btn ghost">Connect folder</button></form></details>
    <details><summary>Add a download link</summary><form id="media-link-form"><label>Name<input class="field" name="name" placeholder="Shared footage"></label><label>Direct file or shared Google Drive link<input class="field" name="url" type="url" placeholder="https://…" required></label><button class="btn ghost">Fetch media</button><small class="muted">For a private cloud folder, connect its synced PC location.</small></form></details>
  </aside><section><div class="panel media-filters"><input class="field" id="media-search" placeholder="Search filenames and folders" aria-label="Search media"><select class="field" id="media-kind" aria-label="Media type"><option value="">All types</option><option value="video">Video</option><option value="audio">Audio</option><option value="image">Images</option></select></div>
    <div class="panel media-selection"><input class="field" id="media-project-name" placeholder="Name your edit" value="Meduza edit"><button class="btn" id="media-edit" disabled>Edit selected in snakeitbaby</button><button class="btn ghost" id="media-clear">Clear selection</button></div>
    <p id="media-message" role="status" class="media-message"></p><div id="media-transfers" class="muted"></div>
    <div id="media-grid" class="media-grid"></div><div class="media-pagination"><button class="btn ghost" id="media-prev">Previous</button><span id="media-page"></span><button class="btn ghost" id="media-next">Next</button></div>
  </section></div><dialog id="media-preview"><div class="media-preview-head"><strong id="media-preview-name"></strong><button class="btn ghost" id="media-preview-close">Close</button></div><div id="media-preview-content"></div></dialog>`;
}

async function mediaApi(route, payload) {
  const response = await fetch(route, payload === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The local media service could not complete the request.');
  return result;
}

function mediaBytes(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${Math.ceil(bytes / 1024)} KiB`;
}

function connectWorkspace() {
  let active = true;
  async function update() {
    try {
      const [listing, engineResult, telegramResult] = await Promise.all([
        mediaApi('/api/library'),
        mediaApi('/api/engine').catch(error => ({ ready: false, state: error.message })),
        mediaApi('/api/status').catch(error => ({ error: error.message })),
      ]);
      if (!active) return;
      const counts = document.querySelector('#workspace-counts');
      counts.replaceChildren();
      for (const [value, label] of [[listing.total, 'media files'], [listing.sources.length, 'configured locations'], [engineResult.ready ? 'Ready' : 'Offline', 'snakeitbaby']]) {
        const box = document.createElement('div'); box.className = 'panel stat';
        const number = document.createElement('b'); number.className = 'num'; number.textContent = value;
        const caption = document.createElement('span'); caption.className = 'muted'; caption.textContent = label;
        box.append(number, caption); counts.append(box);
      }
      const sources = document.querySelector('#workspace-sources'); sources.replaceChildren();
      for (const item of listing.sources) {
        const row = document.createElement('div'); row.className = 'row';
        const title = document.createElement('span'); title.className = 'grow'; title.textContent = item.name;
        const state = document.createElement('small'); state.textContent = item.state || 'Scanning';
        row.append(title, state); sources.append(row);
      }
      document.querySelector('#workspace-message').textContent = listing.scanning ? 'Scanning configured sources…' : '';
      document.querySelector('#workspace-engine').textContent = `snakeitbaby: ${engineResult.state}`;
      const watched = (telegramResult.sources || []).filter(source => source.watch).length;
      document.querySelector('#workspace-telegram').textContent = telegramResult.error ? `Telegram unavailable: ${telegramResult.error}` : `Telegram: ${watched} watched sources · ${telegramResult.note}`;
      const progress = telegramResult.progress;
      document.querySelector('#workspace-download').textContent = progress ? `${progress.state}: ${progress.name} · ${mediaBytes(progress.received)} / ${mediaBytes(progress.total)}${progress.state === 'downloading' ? ` · ${mediaBytes(progress.bytes_per_second)}/s` : ''}` : 'No Telegram file is downloading.';
      const bar = document.querySelector('#workspace-progress');
      bar.hidden = !progress || progress.state !== 'downloading';
      if (progress?.total) bar.value = progress.received / progress.total * 100;
      document.querySelector('#workspace-checked').textContent = `Last checked ${new Date().toLocaleTimeString()} · Updates every 5 seconds`;
    } catch (error) {
      if (active) document.querySelector('#workspace-message').textContent = error.message;
    }
  }
  update(); const timer = setInterval(update, 5000);
  return () => { active = false; clearInterval(timer); };
}

function connectMediaLibrary(exportsOnly = false) {
  const element = id => document.getElementById(id);
  const selected = new Map();
  let source = exportsOnly ? 'exports' : '';
  let page = 0;
  let current;
  let active = true;
  let loading = false;
  let working = false;
  let searchTimer;
  const dialog = element('media-preview');

  function message(text) { if (active) element('media-message').textContent = text; }
  function selection() {
    element('media-edit').disabled = working || !selected.size;
    element('media-edit').textContent = `Edit ${selected.size || ''} selected in snakeitbaby`;
  }
  function preview(item) {
    element('media-preview-name').textContent = item.name;
    const container = element('media-preview-content'); container.replaceChildren();
    const media = document.createElement(item.kind === 'image' ? 'img' : item.kind === 'audio' ? 'audio' : 'video');
    media.src = item.url;
    if (item.kind !== 'image') media.controls = true;
    media.alt = item.name;
    container.append(media); dialog.showModal();
  }
  dialog.addEventListener('close', () => element('media-preview-content').replaceChildren());
  element('media-preview-close').onclick = () => dialog.close();

  function render(listing) {
    current = listing;
    element('media-summary').textContent = `${listing.total} matching files${listing.scanning ? ' · Scanning…' : ''}`;
    const locations = element('media-sources'); locations.replaceChildren();
    for (const item of [{ id: '', name: 'All locations' }, ...listing.sources]) {
      const button = document.createElement('button'); button.className = `media-source ${source === item.id ? 'selected' : ''}`;
      const name = document.createElement('strong'); name.textContent = item.name; button.append(name);
      if (item.path) { const path = document.createElement('small'); path.textContent = item.path; button.append(path); }
      if (item.state) { const status = document.createElement('small'); status.textContent = item.state; button.append(status); }
      button.onclick = () => { source = item.id; page = 0; load(); };
      locations.append(button);
    }
    const grid = element('media-grid'); grid.replaceChildren();
    for (const item of listing.items) {
      const card = document.createElement('article'); card.className = 'panel media-card';
      const cover = document.createElement('button'); cover.className = 'media-cover'; cover.type = 'button'; cover.setAttribute('aria-label', `Preview ${item.name}`);
      if (item.kind === 'image') { const image = document.createElement('img'); image.src = item.url; image.loading = 'lazy'; image.alt = ''; cover.append(image); }
      else { const label = document.createElement('span'); label.textContent = item.kind === 'video' ? '▶ VIDEO' : '♫ AUDIO'; cover.append(label); }
      cover.onclick = () => preview(item);
      const name = document.createElement('strong'); name.textContent = item.name; name.title = item.path;
      const detail = document.createElement('small'); detail.className = 'muted'; detail.textContent = `${item.kind} · ${mediaBytes(item.bytes)}`;
      const label = document.createElement('label'); label.className = 'media-select';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(item.id);
      checkbox.onchange = () => { if (checkbox.checked) selected.set(item.id, item); else selected.delete(item.id); selection(); };
      label.append(checkbox, document.createTextNode('Use in edit'));
      card.append(cover, name, detail, label); grid.append(card);
    }
    if (!listing.items.length) {
      const empty = document.createElement('div'); empty.className = 'panel';
      empty.textContent = listing.scanning ? 'Scanning this location…' : 'No matching media here. Import files, connect a folder, or change the search.'; grid.append(empty);
    }
    element('media-transfers').textContent = listing.transfers.map(item => `${item.name} · ${item.state}${item.received ? ' · ' + mediaBytes(item.received) : ''}${item.error ? ' · ' + item.error : ''}`).join(' | ');
    element('media-page').textContent = `Page ${page + 1} of ${Math.max(1, Math.ceil(listing.total / 60))}`;
    element('media-prev').disabled = page === 0; element('media-next').disabled = (page + 1) * 60 >= listing.total;
    selection();
  }

  async function load() {
    if (loading || !active) return;
    loading = true;
    try {
      const query = new URLSearchParams({ source, page, search: element('media-search').value, kind: element('media-kind').value });
      const listing = await mediaApi(`/api/library?${query}`);
      if (active) render(listing);
    } catch (error) { message(error.message); } finally { loading = false; }
  }
  async function action(task) {
    working = true; selection();
    try { await task(); await load(); } catch (error) { message(error.message); }
    finally { working = false; if (active) selection(); }
  }
  element('media-search').oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page = 0; load(); }, 250); };
  element('media-kind').onchange = () => { page = 0; load(); };
  element('media-prev').onclick = () => { page--; load(); };
  element('media-next').onclick = () => { page++; load(); };
  element('media-clear').onclick = () => { selected.clear(); if (current) render(current); };
  element('media-refresh').onclick = () => action(async () => { await mediaApi('/api/library/refresh', {}); message('Refreshing configured locations…'); });
  for (const type of ['folder', 'link']) {
    element(`media-${type}-form`).onsubmit = event => {
      event.preventDefault(); const form = event.currentTarget;
      action(async () => { await mediaApi(`/api/library/${type}`, Object.fromEntries(new FormData(form))); form.reset(); message(type === 'folder' ? 'Folder connected. Scanning media…' : 'Fetching the linked media…'); });
    };
  }
  element('media-pick').onclick = () => element('media-upload').click();
  element('media-upload').onchange = event => {
    const files = [...event.target.files];
    action(async () => {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open('POST', `/api/library/upload?name=${encodeURIComponent(file.name)}`);
          request.upload.onprogress = progress => message(`Importing ${index + 1}/${files.length}: ${file.name} · ${mediaBytes(progress.loaded)} / ${mediaBytes(file.size)}`);
          request.onload = () => request.status === 200 ? resolve() : reject(new Error(JSON.parse(request.responseText).error || 'Import failed.'));
          request.onerror = () => reject(new Error('Upload interrupted. Select the file to retry.'));
          request.send(file);
        });
      }
      message(`${files.length} file(s) imported. The library refreshes as indexing finishes.`);
      element('media-upload').value = '';
    });
  };
  element('media-edit').onclick = () => action(async () => {
    const handoff = await mediaApi('/api/library/handoff', { ids: [...selected.keys()], name: element('media-project-name').value });
    window.location.assign(handoff.url);
  });
  load(); const timer = setInterval(load, 5000);
  return () => { active = false; clearTimeout(searchTimer); clearInterval(timer); if (dialog.open) dialog.close(); };
}

function snakeEditorView() {
  return `<div class="head"><div><h1>snakeitbaby</h1><p class="lead">Meduza’s built-in video editor.</p></div><a class="btn" href="http://127.0.0.1:18470/projects" target="_blank" rel="noreferrer">Open full editor</a></div>
    <p id="editor-service-status" role="status">Checking the installed editor…</p>
    <iframe id="snake-editor" class="opencut-frame" hidden title="snakeitbaby video editor" allow="clipboard-read; clipboard-write; fullscreen"></iframe>`;
}

function connectSnakeEditor() {
  let active = true;
  let checking = false;
  async function check() {
    if (checking) return;
    checking = true;
    try {
      const engine = await mediaApi('/api/engine');
      if (!active) return;
      document.querySelector('#editor-service-status').textContent = `snakeitbaby: ${engine.state}`;
      const frame = document.querySelector('#snake-editor');
      if (engine.ready && !frame.getAttribute('src')) frame.src = 'http://127.0.0.1:18470/projects';
      frame.hidden = !engine.ready;
    } catch (error) {
      if (active) document.querySelector('#editor-service-status').textContent = `Cannot reach the local media service: ${error.message}`;
    } finally { checking = false; }
  }
  check(); const timer = setInterval(check, 5000);
  return () => { active = false; clearInterval(timer); };
}
