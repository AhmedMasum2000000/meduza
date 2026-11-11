# Local Meduza editor

The public edition is published separately at https://github.com/AhmedMasum2000000/snakeitbaby. This directory contains the optional local editor and media service.

The **Meduza Studio** desktop shortcut starts the local services. The workspace includes snakeitbaby, projects, the media library, Telegram inbox, and exports.

- **PC uploads** — Open Media library and choose **Import from PC**.
- **Telegram** — Open Telegram inbox and choose a channel or group. Watch new posts automatically, or confirm a download of existing files. Download progress appears in the inbox and workspace.
- **Google Drive** — Use **Add a download link** with a downloadable shared file or folder link.
- **Other drives** — Use a direct HTTP(S) media link, or use **Add a folder** with a mounted, network, or locally synced directory. Private cloud folders use their desktop sync client.
- **Editing** — Select media and choose **Edit selected in snakeitbaby**. The export dialog can save the finished video to the Exports library.

The workspace listens on `127.0.0.1:18465` and the editor on `127.0.0.1:18470`. The local services handle media and Telegram access. Original media and exports use `C:/MEDUSA/assets`. Telegram sign-in and source settings are stored in the Windows user's local application data, and editor projects are stored in the browser profile.

On another Windows PC, install Node.js, Python 3.13, and Bun 1.2.18. In `meduza-telegram`, create `.venv` and install `requirements.txt`. In `opencut`, run `bun install --frozen-lockfile`. Configure `opencut/apps/web/.env.local` from the example with the local editor URL and a generated authentication secret, then run `bun run build` from `opencut/apps/web`. Run `start_meduza.pyw` and complete Telegram sign-in when prompted.

Engine attribution is available in the editor's About page and in `opencut/LICENSE`.
