import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve, extname, sep } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";

const root = resolve(process.argv[2]);
const browserPath = process.env.SNAKEITBABY_BROWSER;
const temp = await mkdtemp(join(tmpdir(), "snakeitbaby-qa-"));
const base = "/meduza/snakeitbaby/";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".wasm": "application/wasm", ".json": "application/json", ".png": "image/png" };
const server = createServer(async (req, res) => {
    const route = new URL(req.url, "http://localhost").pathname;
    if (!route.startsWith(base)) { res.writeHead(404).end(); return; }
    const path = resolve(root, route.slice(base.length), ...(extname(route) ? [] : ["index.html"]));
    if (!path.startsWith(root + sep)) { res.writeHead(404).end(); return; }
    try {
        const body = await readFile(path);
        res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" }).end(body);
    } catch {
        console.error("Missing static asset:", route); res.writeHead(404).end();
    }
});
let browser;
try {
    const fixture = join(temp, "qa-clip.mp4");
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
        "color=c=blue:s=320x180:r=30:d=3", "-f", "lavfi", "-i",
        "sine=frequency=440:duration=3", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest", fixture]);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}${base}`;
    browser = await chromium.launch({ executablePath: browserPath, args: ["--enable-unsafe-webgpu", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(12000);
    page.on("pageerror", error => console.error("Browser:", error.message));
    await page.goto(url);
    const dismiss = async name => {
        const button = page.getByRole("button", { name, exact: true });
        if (await button.count()) await button.click();
    };
    await dismiss("Not now");
    await page.getByRole("button", { name: "New project", exact: true }).first().click();
    await page.waitForURL("**/editor*project=*");
    await page.getByRole("button", { name: "Start editing", exact: true }).click({ timeout: 30000 });

    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await (await chooser).setFiles(fixture);
    const clip = page.getByTitle("qa-clip.mp4", { exact: true }).first();
    await clip.hover();
    await clip.locator("..").getByRole("button").first().click();
    await page.getByText("qa-clip.mp4", { exact: true }).last().click();
    const left = await page.getByRole("button", { name: "Left resize handle" }).boundingBox();
    const right = await page.getByRole("button", { name: "Right resize handle" }).boundingBox();
    assert.ok(left && right);
    await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
    await page.mouse.down();
    await page.mouse.move(right.x + right.width / 2 - (right.x - left.x) / 3, right.y + right.height / 2, { steps: 12 });
    await page.mouse.up();
    const originalUrl = page.url();
    const backupPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Back up project", exact: true }).click();
    const backup = join(temp, "test.snakeitbaby");
    await (await backupPromise).saveAs(backup);
    await page.reload();
    await page.getByText("qa-clip.mp4", { exact: true }).first().waitFor();
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await page.waitForURL("**/projects/");
    const restorePromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Restore project", exact: true }).click();
    await (await restorePromise).setFiles(backup);
    await page.waitForURL("**/editor*project=*");
    assert.notEqual(page.url(), originalUrl);
    await page.getByText("qa-clip.mp4", { exact: true }).first().waitFor();
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const videoPromise = page.waitForEvent("download", { timeout: 90000 });
    await page.getByRole("button", { name: "Export", exact: true }).last().click();
    const video = join(temp, "render.mp4");
    await (await videoPromise).saveAs(video);
    const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams",
        "-show_format", "-of", "json", video], { encoding: "utf8" }));
    assert.ok(probe.streams.some(stream => stream.codec_type === "video"));
    assert.ok(probe.streams.some(stream => stream.codec_type === "audio"));
    assert.ok(Math.abs(Number(probe.format.duration) - 2) < 0.25);
    console.log("Passed: import, trim, reload, backup, restore as a copy, and export with audio.");
} finally {
    await browser?.close();
    server.close();
    await rm(temp, { recursive: true, force: true });
}






