"""Start the installed local Meduza workspace and its OpenCut editor."""
import os
import msvcrt
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request
import webbrowser


ROOT = Path(__file__).resolve().parent
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def available(url):
    try:
        with OPENER.open(url, timeout=2) as response:
            return response.status == 200
    except Exception:
        return False


def start(command, folder, name):
    with (folder / f'{name}.out.log').open('a', encoding='utf-8') as output:
        with (folder / f'{name}.err.log').open('a', encoding='utf-8') as error:
            environment = dict(os.environ, NEXT_TELEMETRY_DISABLED='1')
            subprocess.Popen(command, cwd=folder, env=environment, stdout=output, stderr=error,
                             creationflags=subprocess.CREATE_NO_WINDOW)


def main():
    media = ROOT / 'meduza-telegram'
    python = media / '.venv' / 'Scripts' / 'python.exe'
    editor = ROOT / 'opencut' / 'apps' / 'web'
    node = shutil.which('node.exe') or 'C:/Program Files/nodejs/node.exe'
    private = Path(os.environ['LOCALAPPDATA']) / 'MeduzaTelegram'
    if not available('http://127.0.0.1:18465/api/status'):
        if (private / 'api.json').is_file() and (private / 'telegram.session').is_file():
            start([str(python), '-u', 'telegram_inbox.py', '--folder', 'C:/MEDUSA/assets/incoming/telegram'], media, 'inbox')
        else:
            if not available('http://127.0.0.1:18466/status'):
                start([str(python), '-u', 'setup_login.py'], media, 'login')
            webbrowser.open('http://127.0.0.1:18466/')
            return
    if not available('http://127.0.0.1:18470/api/health'):
        start([node, str(editor / 'node_modules' / 'next' / 'dist' / 'bin' / 'next'),
               'start', '--hostname', '127.0.0.1', '--port', '18470'], editor, 'editor')
    for _ in range(60):
        if available('http://127.0.0.1:18465/api/status') and available('http://127.0.0.1:18470/api/health'):
            break
        time.sleep(1)
    webbrowser.open('http://127.0.0.1:18465/#/home')


if __name__ == '__main__':
    with (ROOT / 'meduza-telegram' / 'launcher.lock').open('a+b') as lock:
        if lock.tell() == 0:
            lock.write(b'0')
            lock.flush()
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            raise SystemExit(0)
        try:
            main()
        finally:
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
