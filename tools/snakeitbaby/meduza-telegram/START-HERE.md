# Meduza Studio Telegram inbox

Meduza Studio now has a configured media library, Telegram intake, snakeitbaby editing, and an exports library. The main source is `C:\MEDUSA\assets`. It indexes folders recursively and makes media available for preview and editing. Additional PC folders, network paths, synced cloud folders, direct media links, and shared Google Drive download links can be configured in the library.

On this installed PC, use the **Meduza Studio** desktop shortcut. It starts both local services. The media workspace is at `http://127.0.0.1:18465/` and the installed snakeitbaby editor is at `http://127.0.0.1:18470/projects`. The shortcut refers to this installation's Python and Node paths.

Select files in the media library and choose **Edit selected in snakeitbaby** to create a project and arrange the files on its timeline. Inside a project, **Meduza library** imports more media from configured sources. snakeitbaby projects and their imported media persist in the browser profile used to edit. The export dialog can also save finished videos under `C:\MEDUSA\assets\exports`, which appear in Meduza's **Exports** section.

The built-in editor is named **snakeitbaby**. Its engine is adapted from the official [OpenCut Classic](https://github.com/OpenCut-app/opencut-classic) version recommended by the [OpenCut maintainers](https://github.com/OpenCut-app/OpenCut#status). The local integration adds Meduza library imports and export saving. The engine source and MIT attribution are retained in the installation. This inbox ZIP alone contains the media service; the full source backup also includes the customized editor.

## Start on Windows

1. Extract the full ZIP and open PowerShell in the extracted folder.
2. At [my.telegram.org](https://my.telegram.org), open **API development tools** and get an API ID and hash.
3. Run these commands. The last command stores videos in a staging folder under the Meduza assets directory.

   ```powershell
   py -3.13 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe setup_login.py
   ```

4. Open [Connect Meduza](http://127.0.0.1:18466/). Enter the API ID and hash, then scan the QR code using Telegram on your phone under Settings, Devices, Link Desktop Device. Enter your two-step verification password on the local page if Telegram asks for it. The listener uses its own Telegram session. Credentials and the session are stored under `%LOCALAPPDATA%\MeduzaTelegram`, outside the Studio folder. Keep those files and sign-in codes private.
5. Open [Telegram inbox](http://127.0.0.1:18465/#/telegram). Choose a channel or group and click **Auto-download new files**. Confirm once to watch new posts. To collect existing posts, choose **Download today’s files** or **Download all existing files**, review the count and size, then confirm with the download button. Downloads have no inbox size cap. Files are saved under `C:\MEDUSA\assets\incoming\telegram`. The progress bar shows the current file, downloaded bytes, percentage, and speed.

On future runs, start the listener with the following command. It uses the saved connection.

```powershell
.\.venv\Scripts\python.exe telegram_inbox.py --folder 'C:\MEDUSA\assets\incoming\telegram'
```

Keep PowerShell open and the PC awake for automatic intake. The listener checks approved sources about every 15 seconds, resumes from its saved position, and skips videos already present in the inbox. Pause a source from Studio. Downloads continue while the drive has enough space for the next video.

For people submitting footage, use a dedicated private Telegram group with the account you connect here. Let contributors know where their footage goes. The account can list groups and channels it has joined, and only selected sources are watched. Saving restrictions and disappearing videos are skipped.
