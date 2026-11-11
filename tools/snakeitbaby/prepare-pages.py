"""Prepare a disposable engine checkout for a GitHub Pages build."""
from pathlib import Path
import shutil
import sys

web = Path(sys.argv[1]).resolve() / "apps/web"
app = web / "src/app"
base = "/meduza/snakeitbaby"


def replace(path, old, new):
    file = web / path
    content = file.read_text(encoding="utf-8")
    if old not in content:
        raise RuntimeError(f"Expected source missing in {path}: {old}")
    file.write_text(content.replace(old, new), encoding="utf-8")


for route in ("api", "blog", "brand", "changelog", "contributors", "meduza",
              "privacy", "roadmap", "rss.xml", "sponsors", "terms"):
    target = (app / route).resolve()
    if target.parent != app.resolve():
        raise RuntimeError(f"Route points outside the build directory: {target}")
    shutil.rmtree(target)
for filename in ("robots.ts", "sitemap.ts"):
    (app / filename).unlink()

editor = app / "editor"
shutil.move(editor / "[project_id]/page.tsx", editor / "page.tsx")
(editor / "[project_id]").rmdir()
replace("src/app/editor/page.tsx", 'import { useParams } from "next/navigation";',
        'import { useSearchParams } from "next/navigation";')
replace("src/app/editor/page.tsx", "useMemo, useState", "Suspense, useMemo, useState")
replace("src/app/editor/page.tsx",
        "const params = useParams();\n\tconst projectId = params.project_id as string;",
        '''return <Suspense fallback={<p>Opening project…</p>}><ProjectEditor /></Suspense>;
}

function ProjectEditor() {
    const projectId = useSearchParams().get("project");
    if (!projectId) return <a href="/meduza/snakeitbaby/projects/">Choose a project</a>;''')
replace("src/app/editor/page.tsx", '\t\t\t\t\t<ChangelogNotification />\n', "")
replace("src/app/editor/page.tsx", "open OpenCut in Chrome", "open snakeitbaby in Chrome")
replace("src/app/projects/page.tsx", "/editor/${project", "/editor/?project=${project")
replace("src/app/page.tsx", 'import { redirect } from "next/navigation";\nexport default function Home() { redirect("/projects"); }',
        'export { default } from "./projects/page";')
replace("src/app/layout.tsx", 'import { Inter } from "next/font/google";', "")
replace("src/app/layout.tsx", 'const siteFont = Inter({ subsets: ["latin"] });', "")
replace("src/app/layout.tsx", '`${siteFont.className} font-sans antialiased`', '"font-sans antialiased"')
replace("src/app/layout.tsx", '\t\t\t\t<BotIdClient protect={protectedRoutes} />\n', "")
replace("src/app/globals.css", "var(--font-inter), sans-serif", "system-ui, sans-serif")
replace("src/fonts/google-fonts.ts", '"/fonts/', f'"{base}/fonts/')
replace("src/components/ui/font-picker.tsx", "url(/fonts/", f"url({base}/fonts/")
replace("src/services/renderer/effect-preview.ts", '"/effects/', f'"{base}/effects/')
replace("src/site/brand.ts", "http://127.0.0.1:18470", "https://ahmedmasum2000000.github.io/meduza/snakeitbaby")
replace("src/site/brand.ts", '"/meduza.png"', f'"{base}/meduza.png"')
replace("src/app/metadata.ts", '"/meduza.png"', f'"{base}/meduza.png"')
replace("src/app/metadata.ts", '"/manifest.json"', f'"{base}/manifest.json"')
replace("public/manifest.json", '"/projects"', f'"{base}/projects/"')
replace("public/manifest.json", '"/meduza.png"', f'"{base}/meduza.png"')
replace("src/app/about/page.tsx", '"/engine-LICENSE.txt"', f'"{base}/engine-LICENSE.txt"')
replace("src/app/about/page.tsx", "installed on this PC", "hosted on GitHub Pages")
replace("src/app/about/page.tsx",
        "Original files and finished exports are stored in configured PC folders. Project timelines and imported project media are stored in this browser profile.",
        "Import files from your device into a project. Projects and imported media stay in this browser profile. Export downloads the finished video.")
replace("src/components/meduza-navigation.tsx", "http://127.0.0.1:18465/#/home", "/meduza/")
replace("src/components/meduza-navigation.tsx", 'src="/meduza.png"', f'src="{base}/meduza.png"')
replace("src/components/meduza-navigation.tsx",
        '        <a href="http://127.0.0.1:18465/#/studio" target="_top">Media library</a>\n'
        '        <a href="http://127.0.0.1:18465/#/videos" target="_top">Exports</a>\n',
        "")
replace("src/components/editor/editor-header.tsx", "http://127.0.0.1:18465/#/studio", "/meduza/")
replace("src/components/editor/mobile-gate.tsx",
        "http://127.0.0.1:18465/#/studio", "/projects")
replace("src/components/editor/mobile-gate.tsx", "Media library", "Projects")
replace("src/components/editor/onboarding.tsx", "Meduza library or Import", "Import in the Media panel")
replace("src/components/editor/onboarding.tsx",
        "Export saves a video to your PC and, with Save to Meduza enabled, to your Exports library.",
        "Export downloads the finished video.")
replace("src/components/editor/panels/assets/views/assets.tsx",
        '\t\t\t\t\t<MeduzaLibrary onImport={({ files }) => processFiles({ files, throwOnError: true })} />\n', "")
replace("src/components/editor/panels/assets/tabbar.tsx",
        'tabKey !== "transitions" && tabKey !== "adjustment"',
        'tabKey !== "transitions" && tabKey !== "adjustment" && tabKey !== "sounds"')
export_button = web / "src/components/editor/export-button.tsx"
text = export_button.read_text(encoding="utf-8")
start = text.index("\t\t\tif (saveToMeduza) {")
end = text.index("\n\t\t\teditor.project.clearExportState();", start)
export_button.write_text(text[:start] + text[end:], encoding="utf-8")
replace("src/components/editor/export-button.tsx", ' disabled={savingToMeduza}', "")
export_button.write_text("\n".join(line for line in export_button.read_text(encoding="utf-8").split("\n")
    if not any(key in line for key in ("setSaveToMeduza", "setSavingToMeduza", "savingToMeduza ?", "Also save to Meduza"))), encoding="utf-8")

(web / "next.config.ts").write_text(f'''
import type {{ NextConfig }} from "next";
import {{ withContentCollections }} from "@content-collections/next";
import path from "node:path";
const config: NextConfig = {{
    output: "export",
    basePath: "{base}",
    trailingSlash: true,
    images: {{ unoptimized: true }},
    turbopack: {{ root: path.resolve(process.cwd(), "../..") }},
}};
export default withContentCollections(config);
''', encoding="utf-8")
