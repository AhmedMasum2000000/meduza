# Snakeitbaby Editor

An open-source browser video editor. Create a project, import media, arrange clips on the timeline, and export a video. Projects and source media stay in the browser profile. Start at https://ahmedmasum2000000.github.io/meduza/snakeitbaby/.

## Run from source

Use Node.js and Bun 1.2.18. From the repository root, run:

    bun install --frozen-lockfile
    cd apps/web
    bun run dev

Open http://localhost:3000/snakeitbaby/. Set `NEXT_PUBLIC_BASE_PATH=/meduza/snakeitbaby` and run `bun run build` for Meduza Pages. Copy the contents of `apps/web/out` to the repository-root `snakeitbaby/` folder. Run `bun run build` without that setting in the same directory to generate the static site in `apps/web/out`. The default URL prefix is `/snakeitbaby`. Set `NEXT_PUBLIC_BASE_PATH` at build time if your host uses another prefix, or set it to an empty string for a site at the domain root.

## Back up and restore projects

In an open project, choose **Back up project** to download a `.snakeitbaby` file containing the timeline and imported media. On the Projects page, choose **Restore project** and select that file. Restore creates a separate project. Use the same editor project version on the other device.

## Release smoke test

Build with `NEXT_PUBLIC_BASE_PATH=/meduza/snakeitbaby`, then run `python qa/pages-assets.py apps/web/out` from the source root to make Next.js navigation assets available on GitHub Pages. Publish the resulting directory.

For the browser test, install FFmpeg and ffprobe on your PATH. Run `npm install --prefix qa --no-save --no-package-lock playwright@1.65.0` and `npx --prefix qa playwright install chromium`. Run `node qa/smoke.mjs apps/web/out`. You can set `SNAKEITBABY_BROWSER` to the path of an installed Chrome binary. The test uses a fresh headless profile and a generated clip.

## Connect an AI server

Open a project and select **AI tools**. Enter the HTTPS base URL of a server you control, for example `https://ai.example.com/editor`. If the server requires it, enter its access token. This token stays in memory while the editor is open. Keep paid provider credentials on the server. The optional **Model** field is passed to the server, which can select any model it supports.

The editor sends a multipart form to one of these endpoints under the base URL. All tasks receive optional `model` and `prompt` fields. The server may use any provider, including one that runs its own models.

| POST suffix | Additional input | Successful response |
| --- | --- | --- |
| `/captions` | Audio or video in the `file` field | SRT text, with timestamps relative to the start of the file |
| `/cuts` | Audio or video in the `file` field | Plain-text suggestions, preferably with timestamps |
| `/video` | A required `prompt` | Raw MP4 or WebM bytes with `Content-Type: video/mp4` or `video/webm` |

Respond with HTTP 2xx only when the result is ready. For asynchronous providers, the server can wait for the job and return the finished result. Use a non-2xx response for errors. Support CORS for the site's origin and allow `POST`, `OPTIONS`, and the `Authorization` header. A server access token is sent as `Authorization: Bearer …`. Authenticate requests and apply limits on the server before issuing paid calls.

A successful caption result can be added as a text track starting at timeline zero. Cut suggestions are displayed for review. Generated video can be imported into project media. The server handles provider authentication and charges. Stopping the browser request may leave an already submitted provider job running.

## License

MIT. The editing engine is adapted from [OpenCut Classic](https://github.com/OpenCut-app/opencut-classic). See [LICENSE](LICENSE) for the upstream copyright and license.
