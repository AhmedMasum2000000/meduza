import argparse
import asyncio
import getpass
import json
import os
import re
import shutil
import threading
from time import monotonic
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlsplit, parse_qs
from urllib.request import build_opener, ProxyHandler

from media_library import MediaLibrary, serve_media


STUDIO = Path(__file__).resolve().parent / 'studio'
ORIGIN = 'http://127.0.0.1:18465'
GIB = 1024 ** 3
RESERVE = 0


def editor_status():
    try:
        opener = build_opener(ProxyHandler({}))
        with opener.open('http://127.0.0.1:18470/api/health', timeout=2) as response:
            health = json.load(response)
        ready = health.get('name') == 'snakeitbaby' and health.get('status') == 'ready'
        return {'name': 'snakeitbaby', 'ready': ready,
                'state': 'Ready' if ready else 'Unexpected editor response'}
    except Exception:
        return {'name': 'snakeitbaby', 'ready': False,
                'state': 'Offline — open the Meduza Studio desktop shortcut to start it'}


class Inbox:
    def __init__(self, client, folder, state_path, cap=None):
        self.client = client
        self.folder = folder
        self.state_path = state_path
        self.cap = cap
        self.watches = json.loads(state_path.read_text('utf-8')) if state_path.exists() else {}
        self.sources = {}
        self.lock = asyncio.Lock()
        self.preview = None
        self.batch = None
        self.progress = None
        self.note = f'Watching {len(self.watches)} Telegram source(s).' if self.watches else 'Choose a Telegram source to start.'

    async def refresh(self):
        sources = {}
        async for dialog in self.client.iter_dialogs():
            if dialog.is_channel or dialog.is_group:
                sources[str(dialog.id)] = dialog
        self.sources = sources

    def save_watches(self):
        temporary = self.state_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(self.watches), encoding='utf-8')
        temporary.replace(self.state_path)

    def storage(self):
        files = [path for path in self.folder.iterdir() if path.is_file()]
        files.sort(key=lambda path: path.stat().st_mtime, reverse=True)
        used = sum(path.stat().st_size for path in files)
        free = shutil.disk_usage(self.folder).free
        return files, used, free

    def status(self):
        files, used, free = self.storage()
        return {
            'folder': str(self.folder), 'used': used, 'free': free, 'cap': self.cap,
            'reserve': RESERVE, 'note': self.note, 'busy': self.batch is not None and not self.batch.done(),
            'progress': self.progress,
            'sources': [{'id': key, 'name': dialog.name, 'watch': key in self.watches,
                         'protected': bool(getattr(dialog.entity, 'noforwards', False))}
                        for key, dialog in self.sources.items()],
            'files': [{'name': path.name, 'bytes': path.stat().st_size}
                      for path in files if not path.name.endswith('.part')][:50],
        }

    def candidate(self, key, message):
        document = getattr(message, 'document', None)
        file = getattr(message, 'file', None)
        size = getattr(document, 'size', None) or getattr(file, 'size', None)
        if not file or not size:
            return None
        if (getattr(message, 'noforwards', False) or getattr(message, 'ttl_period', None)
                or getattr(message.media, 'ttl_seconds', None)):
            return None
        mime_type = getattr(document, 'mime_type', None) or getattr(file, 'mime_type', '') or ''
        category = mime_type.split('/')[0] if '/' in mime_type else 'file'
        original = file.name or f'{category}{file.ext or ".bin"}'
        suffix = Path(original).suffix.lower()
        if not re.fullmatch(r'\.[a-z0-9]{1,10}', suffix):
            suffix = '.bin'
        stem = re.sub(r'[^\w-]+', '-', Path(original).stem).strip('-')[:65] or 'file'
        path = self.folder / f'{key}_{message.id}_{stem}{suffix}'
        if path.is_file() and path.stat().st_size == size:
            return None
        return message, path, size

    async def source(self, key):
        dialog = self.sources.get(key)
        if dialog is None:
            raise ValueError('Select an available Telegram channel or group.')
        entity = await self.client.get_entity(dialog.input_entity)
        if getattr(entity, 'noforwards', False):
            raise ValueError('This source restricts saving its posts.')
        return dialog

    def fits(self, size):
        _, used, free = self.storage()
        available = free if self.cap is None else min(self.cap - used, free)
        return size <= available

    async def download(self, item):
        message, path, size = item
        if path.is_file() and path.stat().st_size == size:
            return
        if not self.fits(size):
            raise ValueError('The file needs more available disk space.')
        part = path.with_name(path.name + '.part')
        self.note = f'Downloading {path.name}'
        started = monotonic()

        def report(received, total):
            self.progress = {
                'name': path.name, 'received': received, 'total': total or size,
                'bytes_per_second': received / max(monotonic() - started, 0.001),
                'state': 'downloading',
            }

        report(0, size)
        try:
            photo = getattr(message, 'photo', None)
            thumbnail = self.client._get_thumb(photo.sizes, None).type if photo else None
            with part.open('wb') as stream:
                await self.client.download_media(message, file=stream, thumb=thumbnail, progress_callback=report)
            if part.stat().st_size != size:
                raise OSError('Telegram returned an incomplete file.')
            part.replace(path)
            report(size, size)
            self.progress['state'] = 'complete'
        except BaseException:
            self.progress['state'] = 'stopped'
            raise
        finally:
            part.unlink(missing_ok=True)
        self.note = f'Saved {path.name}'

    async def watch(self, key, enabled):
        if not enabled:
            self.watches.pop(key, None)
            self.save_watches()
            return
        async with self.lock:
            if key in self.watches:
                return
            dialog = await self.source(key)
            latest = await self.client.get_messages(dialog.input_entity, limit=1)
            self.watches[key] = latest[0].id if latest else 0
            self.save_watches()

    async def poll(self):
        while True:
            await asyncio.sleep(15)
            for key in list(self.watches):
                try:
                    await self.sync_source(key)
                except Exception as error:
                    self.note = f'Auto-download paused for this source. {type(error).__name__}: {error}'

    async def sync_source(self, key):
        async with self.lock:
            if key not in self.watches:
                return
            dialog = await self.source(key)
            messages = self.client.iter_messages(dialog.input_entity, min_id=self.watches[key], reverse=True, limit=100)
            async for message in messages:
                if key not in self.watches:
                    break
                item = self.candidate(key, message)
                if item:
                    await self.download(item)
                if key in self.watches:
                    self.watches[key] = message.id
                    self.save_watches()

    async def scan(self, key, scope='today'):
        if scope not in {'today', 'all'}:
            raise ValueError('Choose today or all history.')
        dialog = await self.source(key)
        now = datetime.now().astimezone()
        items = []
        checked = 0
        async for message in self.client.iter_messages(dialog.input_entity):
            if scope == 'today' and message.date.astimezone().date() < now.date():
                break
            checked += 1
            item = self.candidate(key, message)
            if item:
                items.append(item)
        size = sum(item[2] for item in items)
        token = uuid4().hex
        self.preview = (token, key, items)
        return {'token': token, 'count': len(items), 'bytes': size, 'fits': self.fits(size),
                'scope': scope, 'date': now.date().isoformat(), 'timezone': now.strftime('UTC%z'),
                'examples': [item[1].name for item in items[:5]], 'messages_checked': checked}

    async def start_batch(self, token):
        if self.batch is not None and not self.batch.done():
            raise ValueError('A confirmed batch is still running.')
        if not self.preview or self.preview[0] != token:
            raise ValueError('Scan again to review the batch.')
        _, key, items = self.preview
        self.preview = None
        self.batch = asyncio.create_task(self.download_batch(key, items))

    async def download_batch(self, key, items):
        try:
            async with self.lock:
                await self.source(key)
                pending = [item for item in items if not item[1].is_file() or item[1].stat().st_size != item[2]]
                if not self.fits(sum(item[2] for item in pending)):
                    raise ValueError('The confirmed batch needs more available disk space.')
                for item in pending:
                    await self.download(item)
                self.note = f'Batch complete. {len(pending)} new file(s) saved.'
        except Exception as error:
            self.note = f'Batch stopped. {type(error).__name__}: {error}'

    async def request(self, route, data):
        if route == '/api/refresh':
            await self.refresh()
        elif route == '/api/watch':
            await self.watch(data['source'], data['enabled'] is True)
        elif route == '/api/scan':
            return await self.scan(data['source'], data.get('scope', 'today'))
        elif route == '/api/download':
            await self.start_batch(data['token'])
        return self.status()


def dashboard(loop, inbox):
    library = MediaLibrary(inbox.state_path.parent, inbox.folder)
    threading.Thread(target=library.monitor, daemon=True).start()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(STUDIO), **kwargs)

        def end_headers(self):
            if self.headers.get('Origin') == 'http://127.0.0.1:18470' and self.path.startswith('/api/library'):
                self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:18470')
                self.send_header('Vary', 'Origin')
            super().end_headers()

        def do_OPTIONS(self):
            if (self.headers.get('Host') != '127.0.0.1:18465'
                    or self.headers.get('Origin') != 'http://127.0.0.1:18470'
                    or not self.path.startswith('/api/library')):
                return self.send_error(403)
            self.send_response(204)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
            self.send_header('Access-Control-Max-Age', '600')
            self.end_headers()

        def do_GET(self):
            if self.headers.get('Host') != '127.0.0.1:18465':
                return self.send_error(403)
            path = urlsplit(self.path).path
            if path == '/api/engine':
                return self.reply_json(editor_status())
            if path == '/api/library':
                try:
                    return self.reply_json(library.listing(parse_qs(urlsplit(self.path).query)))
                except ValueError as error:
                    return self.reply_json({'error': str(error)}, 400)
            if path.startswith('/api/library/handoff/'):
                with library.lock:
                    manifest = library.manifests.get(path.rsplit('/', 1)[-1])
                return self.reply_json(manifest or {'error': 'Selection expired. Send the files from Meduza again.'}, 200 if manifest else 404)
            if path.startswith('/api/library/file/'):
                try:
                    return serve_media(self, library.file(path.rsplit('/', 1)[-1]))
                except (KeyError, OSError, ValueError):
                    return self.send_error(404, 'Media file unavailable')
            if path == '/api/status':
                return self.call_api({})
            if path not in {'/', '/index.html', '/assets/meduza.js', '/assets/meduza.css',
                            '/assets/medusa.png', '/assets/medusa-face.png', '/assets/inbox.js',
                            '/assets/library.js', '/assets/library.css'}:
                return self.send_error(404)
            return super().do_GET()

        def do_POST(self):
            if (self.headers.get('Host') != '127.0.0.1:18465'
                    or self.headers.get('Origin') not in {ORIGIN, 'http://127.0.0.1:18470'}):
                return self.send_error(403)
            path = urlsplit(self.path).path
            if path == '/api/library/upload':
                return self.upload_media()
            if self.headers.get('Content-Type') != 'application/json':
                return self.send_error(415)
            if path.startswith('/api/library/'):
                try:
                    length = int(self.headers.get('Content-Length', '0'))
                    if not 0 < length <= 1024 * 1024:
                        return self.send_error(400)
                    data = json.loads(self.rfile.read(length))
                    return self.reply_json(library.request(path, data))
                except (ValueError, KeyError, OSError) as error:
                    return self.reply_json({'error': str(error)}, 400)
            if self.path not in {'/api/refresh', '/api/watch', '/api/scan', '/api/download'}:
                return self.send_error(404)
            if self.headers.get('Origin') != ORIGIN:
                return self.send_error(403)
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 4096:
                    return self.send_error(400)
                data = json.loads(self.rfile.read(length))
            except ValueError:
                return self.send_error(400)
            return self.call_api(data)

        def upload_media(self):
            query = parse_qs(urlsplit(self.path).query)
            name = query.get('name', ['media'])[0]
            name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', name).strip('. ') or 'media'
            from media_library import MEDIA_EXTENSIONS
            if not any(Path(name).suffix.lower() in extensions for extensions in MEDIA_EXTENSIONS.values()):
                return self.reply_json({'error': 'Choose a video, audio, or image file.'}, 400)
            folder = library.assets / 'exports' if query.get('export') == ['true'] else library.imports / 'uploads'
            folder.mkdir(parents=True, exist_ok=True)
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length < 1 or length > shutil.disk_usage(folder).free:
                    return self.reply_json({'error': 'The file needs more available disk space.'}, 400)
                final = folder / f'{uuid4().hex[:10]}_{name}'
                part = final.with_suffix(final.suffix + '.part')
                try:
                    remaining = length
                    with part.open('wb') as stream:
                        while remaining:
                            chunk = self.rfile.read(min(1024 * 1024, remaining))
                            if not chunk:
                                raise OSError('Upload interrupted. Select the file to retry.')
                            stream.write(chunk)
                            remaining -= len(chunk)
                    part.replace(final)
                finally:
                    part.unlink(missing_ok=True)
                threading.Thread(target=library.scan, daemon=True).start()
                return self.reply_json({'saved': True, 'name': final.name, 'path': str(final)})
            except (OSError, ValueError) as error:
                return self.reply_json({'error': str(error)}, 400)

        def reply_json(self, value, code=200):
            body = json.dumps(value).encode('utf-8')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def call_api(self, data):
            future = asyncio.run_coroutine_threadsafe(inbox.request(self.path, data), loop)
            try:
                result = future.result(timeout=120)
                code = 200
            except Exception as error:
                future.cancel()
                result = {'error': str(error) or type(error).__name__}
                code = 400
            body = json.dumps(result).encode('utf-8')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return ThreadingHTTPServer(('127.0.0.1', 18465), Handler)


def options():
    parser = argparse.ArgumentParser(description='Meduza Studio Telegram footage inbox')
    parser.add_argument('--folder', type=Path, default=Path.home() / 'Videos' / 'Meduza Telegram Inbox')
    parser.add_argument('--limit-gb', type=int, help='Optional inbox cap in GiB. The default has no cap.')
    args = parser.parse_args()
    if args.limit_gb is not None and args.limit_gb < 1:
        parser.error('--limit-gb must be at least 1')
    return args


async def main(args):
    from telethon import TelegramClient

    private = Path(os.environ['LOCALAPPDATA']) / 'MeduzaTelegram'
    private.mkdir(exist_ok=True)
    folder = args.folder.resolve()
    folder.mkdir(parents=True, exist_ok=True)
    credentials = private / 'api.json'
    if credentials.exists():
        api_id, api_hash = json.loads(credentials.read_text('utf-8'))
    else:
        print('Get an API ID and hash under API development tools at https://my.telegram.org')
        api_id = int(input('API ID: ').strip())
        api_hash = getpass.getpass('API hash: ').strip()
    client = TelegramClient(str(private / 'telegram'), api_id, api_hash, receive_updates=False)
    inbox = Inbox(client, folder, private / 'watches.json', args.limit_gb * GIB if args.limit_gb else None)
    with dashboard(asyncio.get_running_loop(), inbox) as server:
        try:
            await client.start()
            credentials.write_text(json.dumps([api_id, api_hash]), encoding='utf-8')
            await inbox.refresh()
            for path in folder.glob('*.part'):
                if re.fullmatch(r'-?\d+_\d+_.+\.part', path.name):
                    path.unlink(missing_ok=True)
            print(f'Open {ORIGIN}/#/telegram. Keep this window open for automatic downloads.', flush=True)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            await inbox.poll()
        finally:
            await client.disconnect()


if __name__ == '__main__':
    try:
        asyncio.run(main(options()))
    except KeyboardInterrupt:
        pass
