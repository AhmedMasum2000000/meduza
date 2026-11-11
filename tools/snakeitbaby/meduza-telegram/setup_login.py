"""Local, interactive first-run login for the Meduza footage inbox."""
import asyncio
import io
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import qrcode
import qrcode.image.svg
from telethon import TelegramClient, errors

from telegram_inbox import Inbox, dashboard


PAGE = b'''<!doctype html><html><head><meta charset="utf-8"><title>Connect Meduza</title>
<style>body{background:#111318;color:#eee;font:17px system-ui;max-width:620px;margin:7vh auto;padding:24px}input,button{font:inherit;padding:12px;margin:6px 0;width:100%;box-sizing:border-box}button{background:#ffd400;color:#111;border:0;border-radius:8px;cursor:pointer}img{width:280px;height:280px;background:white;padding:12px}a{color:#ffd400}p{line-height:1.6}</style></head>
<body><h1>Connect Meduza</h1><p>This creates a Telegram session saved on this PC for your local footage inbox.</p>
<form id="config"><label>API ID<input id="api-id" required inputmode="numeric" autocomplete="off"></label><label>API hash<input id="api-hash" type="password" required autocomplete="off"></label><button>Connect to Telegram</button></form>
<p id="status" role="status">Enter the credentials from Telegram Development Tools.</p>
<div id="qr" hidden><img id="code" alt="Scan this Telegram login QR code"><p>On your phone, open Telegram, then Settings, Devices, Link Desktop Device. Scan this code and approve Meduza.</p></div>
<form id="password" hidden><label>Telegram two-step verification password<input id="secret" type="password" autocomplete="current-password" required></label><button>Finish sign-in</button></form>
<p id="done" hidden><a href="http://127.0.0.1:18465/#/telegram">Open Meduza Telegram inbox</a></p>
<script>
let revision='';
const byId=id=>document.getElementById(id);
async function post(path,data){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error);}
byId('config').onsubmit=async e=>{e.preventDefault();try{await post('/config',{api_id:byId('api-id').value,api_hash:byId('api-hash').value});byId('api-hash').value='';byId('config').hidden=true;}catch(e){byId('status').textContent=e.message;}};
byId('password').onsubmit=async e=>{e.preventDefault();const p=byId('secret').value;byId('secret').value='';try{await post('/password',{password:p});}catch(e){byId('status').textContent=e.message;}};
async function update(){try{const s=await(await fetch('/status')).json();byId('status').textContent=s.message;byId('qr').hidden=s.stage!=='qr';byId('password').hidden=s.stage!=='password';byId('done').hidden=s.stage!=='ready';if(s.stage==='qr'&&revision!==s.revision){revision=s.revision;byId('code').src='/qr?r='+encodeURIComponent(revision);}}catch(e){byId('status').textContent='Local connection interrupted.';}}
setInterval(update,1500);update();
</script></body></html>'''


class Setup:
    def __init__(self):
        self.stage = 'config'
        self.message = 'Enter the credentials from Telegram Development Tools.'
        self.revision = 0
        self.svg = b''
        self.client = None
        self.task = None
        self.private = Path(os.environ['LOCALAPPDATA']) / 'MeduzaTelegram'
        self.private.mkdir(exist_ok=True)
        self.inbox_server = None
        self.poll_task = None

    async def ready(self):
        folder = Path('C:/MEDUSA/assets/incoming/telegram')
        folder.mkdir(parents=True, exist_ok=True)
        inbox = Inbox(self.client, folder, self.private / 'watches.json')
        await inbox.refresh()
        self.inbox_server = dashboard(asyncio.get_running_loop(), inbox)
        threading.Thread(target=self.inbox_server.serve_forever, daemon=True).start()
        self.poll_task = asyncio.create_task(inbox.poll())
        temporary = self.private / 'api.tmp'
        temporary.write_text(json.dumps([self.client.api_id, self.client.api_hash]), encoding='utf-8')
        temporary.replace(self.private / 'api.json')
        self.stage = 'ready'
        self.message = 'Telegram connected. Open the inbox and select the channel to watch.'
        self.svg = b''

    async def login(self, api_id, api_hash):
        try:
            self.stage = 'connecting'
            self.message = 'Connecting to Telegram...'
            self.client = TelegramClient(str(self.private / 'telegram'), api_id, api_hash,
                                         device_model='Meduza Inbox on Windows')
            await self.client.connect()
            if await self.client.is_user_authorized():
                await self.ready()
                return
            qr = await self.client.qr_login()
            while True:
                output = io.BytesIO()
                qrcode.make(qr.url, image_factory=qrcode.image.svg.SvgPathImage).save(output)
                self.svg = output.getvalue()
                self.revision += 1
                self.stage = 'qr'
                self.message = 'Scan with Telegram on your phone. The code refreshes automatically.'
                try:
                    await qr.wait()
                    break
                except asyncio.TimeoutError:
                    await qr.recreate()
            await self.ready()
        except errors.SessionPasswordNeededError:
            self.stage = 'password'
            self.svg = b''
            self.message = 'QR approved. Enter your Telegram two-step verification password below.'
        except Exception as error:
            self.stage = 'error'
            self.message = f'Connection stopped ({type(error).__name__}). Restart the local login to try again.'

    async def request(self, path, data):
        if path == '/config':
            if self.task is not None:
                raise ValueError('A connection is already being set up.')
            api_id = int(data['api_id'])
            api_hash = str(data['api_hash']).strip()
            if api_id <= 0 or len(api_hash) != 32 or any(c not in '0123456789abcdefABCDEF' for c in api_hash):
                raise ValueError('Check the API ID and API hash from Telegram.')
            self.task = asyncio.create_task(self.login(api_id, api_hash))
        elif path == '/password':
            if self.stage != 'password':
                raise ValueError('The login is not asking for a password.')
            try:
                await self.client.sign_in(password=data['password'])
            except errors.PasswordHashInvalidError:
                raise ValueError('That password was not accepted. Try again.') from None
            await self.ready()
        else:
            raise ValueError('Unknown request.')
        return {'ok': True}


async def main():
    setup = Setup()
    loop = asyncio.get_running_loop()

    class Handler(BaseHTTPRequestHandler):
        def reply(self, code, body, content_type='application/json'):
            self.send_response(code)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.headers.get('Host') != '127.0.0.1:18466':
                return self.send_error(403)
            if self.path == '/':
                return self.reply(200, PAGE, 'text/html; charset=utf-8')
            if self.path == '/status':
                value = {'stage': setup.stage, 'message': setup.message, 'revision': setup.revision}
                return self.reply(200, json.dumps(value).encode())
            if self.path.startswith('/qr?'):
                return self.reply(200, setup.svg, 'image/svg+xml')
            self.send_error(404)

        def do_POST(self):
            if (self.headers.get('Host') != '127.0.0.1:18466'
                    or self.headers.get('Origin') != 'http://127.0.0.1:18466'
                    or self.headers.get('Content-Type') != 'application/json'):
                return self.send_error(403)
            try:
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length <= 4096:
                    return self.send_error(400)
                data = json.loads(self.rfile.read(length))
                future = asyncio.run_coroutine_threadsafe(setup.request(self.path, data), loop)
                result = future.result(60)
                self.reply(200, json.dumps(result).encode())
            except Exception as error:
                message = str(error) if isinstance(error, ValueError) else 'Login request failed. Try again.'
                self.reply(400, json.dumps({'error': message}).encode())

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 18466), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print('Meduza login is ready at http://127.0.0.1:18466/', flush=True)
    try:
        await asyncio.Event().wait()
    finally:
        if setup.client:
            await setup.client.disconnect()
        server.shutdown()


if __name__ == '__main__':
    asyncio.run(main())
