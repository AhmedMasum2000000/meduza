import { publicPath } from "@/site/public-path";
import { MeduzaNavigation } from "@/components/meduza-navigation";
export default function About() {
    return <><MeduzaNavigation /><main className="mx-auto max-w-2xl p-8 space-y-5">
        <h1 className="text-3xl font-bold">snakeitbaby</h1>
        <p>An open-source video editor that runs in your browser.</p>
        <p>Import files from your device into a project. Projects and imported media stay in this browser profile. Export downloads the finished video.</p>
        <h2 className="text-xl font-semibold">Open-source credits</h2>
        <p>The editing engine is adapted from OpenCut Classic, copyright 2025–2026 OpenCut, under the MIT license. This edition adds GitHub Pages hosting and provider-neutral AI server integration.</p>
        <p><a className="underline" href={publicPath("/engine-LICENSE.txt")}>Engine license</a> · <a className="underline" href="https://github.com/OpenCut-app/opencut-classic" target="_blank" rel="noreferrer">Upstream source</a></p>
    </main></>;
}
