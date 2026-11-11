"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEditor } from "@/editor/use-editor";
import { processMediaAssets } from "@/media/processing";
import { parseSubtitleFile } from "@/subtitles/parse";
import { insertCaptionChunksAsTextTrack } from "@/subtitles/insert";
import type { SubtitleCue } from "@/subtitles/types";

type Task = "captions" | "cuts" | "video";
type Result =
    | { type: "captions"; cues: SubtitleCue[] }
    | { type: "cuts"; suggestions: string }
    | { type: "video"; file: File };

export function AiTools() {
    const editor = useEditor();
    const [endpoint, setEndpoint] = useState("");
    const [token, setToken] = useState("");
    const [model, setModel] = useState("");
    const [task, setTask] = useState<Task>("captions");
    const [instructions, setInstructions] = useState("");
    const [file, setFile] = useState<File>();
    const [result, setResult] = useState<Result>();
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [applying, setApplying] = useState(false);
    const pending = useRef<AbortController | null>(null);

    async function run(event: FormEvent) {
        event.preventDefault();
        if (pending.current || applying) return;
        setMessage("");
        setResult(undefined);
        const controller = new AbortController();
        pending.current = controller;
        setBusy(true);
        try {
            const url = new URL(endpoint.trim());
            if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
                throw new Error("Enter your server’s HTTPS URL without credentials, query parameters, or a fragment.");
            }
            if (task !== "video" && !file) throw new Error("Choose the media file to analyze.");
            if (task === "video" && !instructions.trim()) throw new Error("Describe the video you want to generate.");
            url.pathname = url.pathname.replace(/\/+$/, "") + "/" + task;
            const body = new FormData();
            if (model.trim()) body.set("model", model.trim());
            if (instructions.trim()) body.set("prompt", instructions.trim());
            if (task !== "video" && file) body.set("file", file);
            const headers = new Headers();
            if (token.trim()) headers.set("Authorization", `Bearer ${token.trim()}`);
            setMessage("Waiting for your AI server…");
            const response = await fetch(url, {
                method: "POST", body, headers, signal: controller.signal,
                credentials: "omit", redirect: "error", cache: "no-store",
            });
            if (!response.ok) throw new Error(`Your server returned HTTP ${response.status}.`);
            if (task === "captions") {
                const parsed = parseSubtitleFile({ fileName: "captions.srt", input: await response.text() });
                if (!parsed.captions.length) throw new Error("The server returned no valid SRT captions.");
                setResult({ type: "captions", cues: parsed.captions });
            } else if (task === "cuts") {
                const suggestions = (await response.text()).trim();
                if (!suggestions) throw new Error("The server returned no cut suggestions.");
                setResult({ type: "cuts", suggestions });
            } else {
                const video = await response.blob();
                const extension = video.type === "video/mp4" ? "mp4" : video.type === "video/webm" ? "webm" : null;
                if (!extension || !video.size) throw new Error("The server must return a nonempty MP4 or WebM video.");
                setResult({ type: "video", file: new File([video], `Generated video.${extension}`, { type: video.type }) });
            }
            setMessage("Result ready.");
        } catch (error) {
            setMessage(controller.signal.aborted ? "Stopped waiting for the server." :
                error instanceof TypeError ? "Could not reach the server. Check its URL and cross-origin access." :
                    error instanceof Error ? error.message : "The request failed.");
        } finally {
            pending.current = null;
            setBusy(false);
        }
    }

    async function apply() {
        if (!result || applying) return;
        setApplying(true);
        try {
            if (result.type === "captions") {
                insertCaptionChunksAsTextTrack({ editor, captions: result.cues });
                setMessage("Captions added at the start of the timeline.");
            } else if (result.type === "video") {
                const projectId = editor.project.getActive().metadata.id;
                const [asset] = await processMediaAssets({ files: [result.file] });
                if (!asset || !await editor.media.addMediaAsset({ projectId, asset })) {
                    throw new Error("The video could not be imported.");
                }
                setMessage("Video added to project media. Drag it onto the timeline.");
            }
            setResult(undefined);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not apply the result.");
        } finally {
            setApplying(false);
        }
    }

    return <Dialog onOpenChange={(open) => { if (!open) pending.current?.abort(); }}>
        <DialogTrigger asChild><Button variant="outline" size="sm">AI tools</Button></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>AI tools</DialogTitle>
                <DialogDescription>Connect your own AI server. Your server chooses the provider and uses its API credits.</DialogDescription>
            </DialogHeader>
            <form onSubmit={run} className="grid gap-3 p-5">
                <fieldset disabled={busy || applying} className="grid gap-3">
                    <label className="grid gap-1">Server URL
                        <input className="rounded border bg-background p-2" type="url" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} required placeholder="https://your-server.example/editor" />
                    </label>
                    <label className="grid gap-1">Server access token (optional)
                        <input className="rounded border bg-background p-2" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} />
                    </label>
                    <label className="grid gap-1">Model (optional)
                        <input className="rounded border bg-background p-2" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Use server default" />
                    </label>
                    <label className="grid gap-1">Task
                        <select className="rounded border bg-background p-2" value={task} onChange={(event) => { setTask(event.target.value as Task); setResult(undefined); setMessage(""); }}>
                            <option value="captions">Generate captions</option>
                            <option value="cuts">Suggest cuts and pacing</option>
                            <option value="video">Generate video from a prompt</option>
                        </select>
                    </label>
                    {task !== "video" && <label className="grid gap-1">Audio or video to send to your server
                        <input type="file" accept="audio/*,video/*" onChange={(event) => setFile(event.target.files?.[0])} />
                    </label>}
                    <label className="grid gap-1">{task === "video" ? "Video prompt" : "Instructions (optional)"}
                        <textarea className="rounded border bg-background p-2" rows={2} value={instructions} onChange={(event) => setInstructions(event.target.value)} required={task === "video"} />
                    </label>
                    <Button type="submit">Run on my server</Button>
                </fieldset>
                {busy && <Button variant="outline" onClick={() => pending.current?.abort()}>Stop waiting</Button>}
                <p role="status" className="text-sm text-muted-foreground">{message}</p>
                {result?.type === "cuts" && <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">{result.suggestions}</pre>}
                {result?.type === "captions" && <Button disabled={applying} onClick={apply}>Add {result.cues.length} captions to timeline</Button>}
                {result?.type === "video" && <Button disabled={applying} onClick={apply}>Import generated video</Button>}
                <a href="https://github.com/AhmedMasum2000000/meduza/tree/main/tools/snakeitbaby-public#connect-an-ai-server" target="_blank" rel="noreferrer" className="text-sm underline">Server setup and response formats</a>
            </form>
        </DialogContent>
    </Dialog>;
}

