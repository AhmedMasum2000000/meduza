import { MeduzaNavigation } from "@/components/meduza-navigation";
export default function About() {
    return <><MeduzaNavigation /><main className="mx-auto max-w-2xl p-8 space-y-5">
        <h1 className="text-3xl font-bold">snakeitbaby</h1>
        <p>Meduza's built-in video editor, installed on this PC.</p>
        <p>Original files and finished exports are stored in configured PC folders. Project timelines and imported project media are stored in this browser profile.</p>
        <h2 className="text-xl font-semibold">Open-source credits</h2>
        <p>The editing engine is adapted from OpenCut Classic, copyright 2025–2026 OpenCut, under the MIT license. Meduza adds the media library, Telegram intake, local export saving, and workspace integration.</p>
        <p><a className="underline" href="/engine-LICENSE.txt">Engine license</a> · <a className="underline" href="https://github.com/OpenCut-app/opencut-classic" target="_blank" rel="noreferrer">Upstream source</a></p>
    </main></>;
}
