# snakeitbaby on GitHub Pages

Open **Editor** in Meduza, create a project, and use **Import** in the Media panel to add files. Projects and imported media are stored in the browser profile for the GitHub Pages site. Export downloads a video to your device. Files synced from cloud drives can be selected in the file picker.

GitHub Pages serves the static editor. Direct Telegram downloads, shared Drive link downloads, and indexing PC folders require the local media service described below.

To rebuild the published bundle, copy the `opencut` source directory to a disposable build directory. Run `python prepare-pages.py <build-directory>` with that copy as the argument. In the copy, install dependencies with Bun 1.2.18 using `bun install --frozen-lockfile`. From its `apps/web` directory run `bun run build`, then publish the contents of `apps/web/out` to `snakeitbaby/` at the repository root. Keep `.nojekyll` so GitHub Pages serves the generated assets.

## Optional local workspace

The **Meduza Studio** desktop shortcut starts the local services. The workspace includes snakeitbaby, projects, the media library, Telegram inbox, and exports.

- **PC uploads** — Open Media library and choose **Import from PC**.
- **Telegram** — Open Telegram inbox and choose a channel or group. Watch new posts automatically, or confirm a download of existing files. Download progress appears in the inbox and workspace.
- **Google Drive** — Use **Add a download link** with a downloadable shared file or folder link.
- **Other drives** — Use a direct HTTP(S) media link, or use **Add a folder** with a mounted, network, or locally synced directory. Private cloud folders use their desktop sync client.
- **Editing** — Select media and choose **Edit selected in snakeitbaby**. The export dialog can save the finished video to the Exports library.

The workspace listens on `127.0.0.1:18465` and the editor on `127.0.0.1:18470`. The local services handle media and Telegram access. Original media and exports use `C:/MEDUSA/assets`. Telegram sign-in and source settings are stored in the Windows user's local application data, and editor projects are stored in the browser profile.

On another Windows PC, install Node.js, Python 3.13, and Bun 1.2.18. In `meduza-telegram`, create `.venv` and install `requirements.txt`. In `opencut`, run `bun install --frozen-lockfile`. Configure `opencut/apps/web/.env.local` from the example with the local editor URL and a generated authentication secret, then run `bun run build` from `opencut/apps/web`. Run `start_meduza.pyw` and complete Telegram sign-in when prompted.

Engine attribution is available in the editor's About page and in `opencut/LICENSE`.
