"""Configured media locations shared by Meduza Studio and OpenCut."""
import hashlib
import json
import mimetypes
import os
import re
import threading
import urllib.parse
import urllib.request
from email.message import Message
from pathlib import Path
from uuid import uuid4


MEDIA_EXTENSIONS = {
    'video': {'.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts'},
    'image': {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif', '.svg'},
    'audio': {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus', '.aiff'},
}


class MediaLibrary:
    def __init__(self, private, telegram_folder, assets=None):
        self.settings_path = private / 'library.json'
        self.assets = assets or Path('C:/MEDUSA/assets')
        self.imports = self.assets / 'imports'
        self.imports.mkdir(parents=True, exist_ok=True)
        (self.assets / 'exports').mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.scan_lock = threading.Lock()
        self.media = {}
        self.manifests = {}
        self.transfers = {}
        self.scanning = False
        if self.settings_path.exists():
            self.sources = json.loads(self.settings_path.read_text('utf-8'))
        else:
            self.sources = [
                {'id': 'assets', 'name': 'Meduza assets', 'kind': 'folder', 'path': str(self.assets)},
                {'id': 'telegram', 'name': 'Telegram inbox', 'kind': 'folder', 'path': str(telegram_folder)},
                {'id': 'exports', 'name': 'Finished exports', 'kind': 'folder', 'path': str(self.assets / 'exports')},
            ]
            self.save_sources()

    def save_sources(self):
        temporary = self.settings_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(self.sources), encoding='utf-8')
        temporary.replace(self.settings_path)

    def scan(self):
        if not self.scan_lock.acquire(blocking=False):
            return
        self.scanning = True
        try:
            with self.lock:
                sources = [dict(source) for source in self.sources]
            found = {}
            states = {}
            for source in sources:
                root = Path(source['path']).resolve()
                if not root.is_dir():
                    states[source['id']] = 'Location unavailable'
                    continue
                states[source['id']] = 'Connected'
                for directory, folders, files in os.walk(root, followlinks=False):
                    folders[:] = [name for name in folders if not (Path(directory) / name).is_symlink()]
                    for name in files:
                        suffix = Path(name).suffix.lower()
                        kind = next((kind for kind, extensions in MEDIA_EXTENSIONS.items() if suffix in extensions), None)
                        if kind is None:
                            continue
                        try:
                            path = (Path(directory) / name).resolve()
                            if not path.is_relative_to(root):
                                continue
                            details = path.stat()
                            if details.st_size == 0:
                                continue
                        except OSError:
                            continue
                        key = hashlib.sha256(str(path).casefold().encode()).hexdigest()[:24]
                        if key in found:
                            found[key]['sources'].append(source['id'])
                            continue
                        mime = mimetypes.guess_type(name)[0] or f'{kind}/' + suffix.lstrip('.')
                        found[key] = {
                            'id': key, 'name': name, 'path': str(path), 'relative': str(path.relative_to(root)),
                            'kind': kind, 'mime': mime, 'bytes': details.st_size, 'modified': details.st_mtime,
                            'sources': [source['id']], 'url': f'/api/library/file/{key}',
                        }
            with self.lock:
                self.media = found
                for source in self.sources:
                    source['state'] = states.get(source['id'], 'Waiting for scan')
        finally:
            self.scanning = False
            self.scan_lock.release()

    def monitor(self):
        while True:
            self.scan()
            threading.Event().wait(20)

    def listing(self, query):
        search = query.get('search', [''])[0].casefold()
        source = query.get('source', [''])[0]
        kind = query.get('kind', [''])[0]
        page = max(0, int(query.get('page', ['0'])[0]))
        with self.lock:
            items = [dict(item) for item in self.media.values()
                     if (not source or source in item['sources']) and (not kind or item['kind'] == kind)
                     and (not search or search in (item['name'] + ' ' + item['relative']).casefold())]
            items.sort(key=lambda item: item['modified'], reverse=True)
            return {
                'sources': [dict(source) for source in self.sources], 'total': len(items),
                'items': items[page * 60:(page + 1) * 60], 'page': page, 'scanning': self.scanning,
                'transfers': list(self.transfers.values()), 'editor_url': 'http://127.0.0.1:18470/projects',
            }

    def file(self, key):
        with self.lock:
            item = dict(self.media[key])
        if not Path(item['path']).is_file():
            raise ValueError('The file has moved or its source is offline. Refresh the library.')
        return item

    def request(self, route, data):
        if route == '/api/library/folder':
            folder = Path(data['path']).expanduser().resolve()
            if not folder.is_dir():
                raise ValueError('Enter an available folder, drive, or network location.')
            with self.lock:
                match = next((source for source in self.sources if Path(source['path']).resolve() == folder), None)
                if match is None:
                    self.sources.append({'id': uuid4().hex, 'name': data.get('name', '').strip() or folder.name,
                                         'kind': 'folder', 'path': str(folder)})
                    self.save_sources()
            threading.Thread(target=self.scan, daemon=True).start()
        elif route == '/api/library/refresh':
            threading.Thread(target=self.scan, daemon=True).start()
        elif route == '/api/library/link':
            url = data['url'].strip()
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme not in {'http', 'https'} or not parsed.hostname or parsed.username or parsed.password:
                raise ValueError('Enter an HTTP or HTTPS download link.')
            with self.lock:
                source = next((source for source in self.sources if source.get('url') == url), None)
                if source is None:
                    key = uuid4().hex
                    source = {'id': key, 'name': data.get('name', '').strip() or parsed.hostname,
                              'kind': 'link', 'url': url, 'path': str(self.imports / key)}
                    self.sources.append(source)
                    self.save_sources()
                if self.transfers.get(source['id'], {}).get('state') != 'downloading':
                    self.transfers[source['id']] = {'name': source['name'], 'state': 'downloading', 'received': 0}
                    threading.Thread(target=self.fetch_link, args=(dict(source),), daemon=True).start()
        elif route == '/api/library/handoff':
            ids = list(dict.fromkeys(data['ids']))
            if not ids:
                raise ValueError('Select at least one media file.')
            items = [self.file(key) for key in ids]
            token = uuid4().hex
            with self.lock:
                self.manifests[token] = {'name': data.get('name', '').strip() or 'Meduza edit', 'items': items}
            return {'url': f'http://127.0.0.1:18470/meduza?import={token}'}
        else:
            raise ValueError('Unknown media action.')
        return self.listing({})

    def fetch_link(self, source):
        key = source['id']
        folder = Path(source['path'])
        folder.mkdir(parents=True, exist_ok=True)
        try:
            host = urllib.parse.urlparse(source['url']).hostname
            if host == 'drive.google.com':
                import gdown
                if '/folders/' in source['url']:
                    result = gdown.download_folder(source['url'], output=str(folder), quiet=True,
                                                   use_cookies=False)
                else:
                    result = gdown.download(source['url'], output=str(folder) + os.sep,
                                            quiet=True, use_cookies=False)
                if not result:
                    raise ValueError('Drive could not download this link. Check its sharing access or use a synced PC folder.')
            else:
                request = urllib.request.Request(source['url'], headers={'User-Agent': 'MeduzaStudio/1.0'})
                with urllib.request.urlopen(request, timeout=60) as response:
                    if 'text/html' in response.headers.get('Content-Type', ''):
                        raise ValueError('This link opens a web page. Use a direct media link or a synced folder path.')
                    header = Message()
                    header['content-disposition'] = response.headers.get('Content-Disposition', '')
                    name = header.get_filename() or Path(urllib.parse.urlparse(response.url).path).name or 'download'
                    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', name).strip('. ') or 'download'
                    final = folder / name
                    part = folder / (name + '.part')
                    expected = int(response.headers.get('Content-Length', 0))
                    received = 0
                    try:
                        with part.open('wb') as stream:
                            while chunk := response.read(1024 * 1024):
                                stream.write(chunk)
                                received += len(chunk)
                                with self.lock:
                                    self.transfers[key] = {'name': source['name'], 'state': 'downloading',
                                                           'received': received, 'total': expected}
                        if expected and received != expected:
                            raise OSError('The remote transfer ended before the file was complete.')
                        part.replace(final)
                    finally:
                        part.unlink(missing_ok=True)
            with self.lock:
                self.transfers[key] = {'name': source['name'], 'state': 'complete'}
        except Exception as error:
            with self.lock:
                self.transfers[key] = {'name': source['name'], 'state': 'failed', 'error': str(error)}
        finally:
            self.scan()


def serve_media(handler, item, head=False):
    path = Path(item['path'])
    with path.open('rb') as stream:
        size = path.stat().st_size
        start, end = 0, size - 1
        requested = handler.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
            if not match or not any(match.groups()):
                return handler.send_error(416)
            first, last = match.groups()
            start = int(first) if first else max(0, size - int(last))
            end = min(size - 1, int(last)) if first and last else size - 1
            if start > end or start >= size:
                handler.send_response(416)
                handler.send_header('Content-Range', f'bytes */{size}')
                handler.end_headers()
                return
        handler.send_response(206 if requested else 200)
        handler.send_header('Content-Type', item['mime'])
        handler.send_header('Content-Length', str(end - start + 1))
        handler.send_header('Accept-Ranges', 'bytes')
        handler.send_header('Cache-Control', 'private, no-cache')
        handler.send_header('X-Content-Type-Options', 'nosniff')
        handler.send_header('Content-Security-Policy', "default-src 'none'; sandbox")
        if requested:
            handler.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        handler.end_headers()
        if head:
            return
        stream.seek(start)
        remaining = end - start + 1
        try:
            while remaining:
                chunk = stream.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                handler.wfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
