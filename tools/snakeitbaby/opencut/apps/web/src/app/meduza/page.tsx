"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorCore } from "@/core";
import { processMediaAssets } from "@/media/processing";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { mediaTimeFromSeconds, mediaTimeToSeconds } from "@/wasm";

interface IncomingFile { id: string; name: string; url: string; mime: string }

export default function MeduzaImport() {
	const router = useRouter();
	const started = useRef(false);
	const [message, setMessage] = useState("Opening your Meduza selection…");
	const [error, setError] = useState(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		async function openSelection() {
			try {
				const token = new URLSearchParams(window.location.search).get("import");
				if (!token) { router.replace("/projects"); return; }
				const response = await fetch(`/meduza-backend/api/library/handoff/${encodeURIComponent(token)}`);
				const manifest = await response.json();
				if (!response.ok) throw new Error(manifest.error || "The Meduza selection is unavailable.");
				const editor = EditorCore.getInstance();
				const savedKey = `meduza-project:${token}`;
				let projectId = sessionStorage.getItem(savedKey);
				if (projectId) {
					await editor.project.loadProject({ id: projectId });
				} else {
					projectId = await editor.project.createNewProject({ name: manifest.name });
					sessionStorage.setItem(savedKey, projectId);
				}
				const completedKey = `meduza-files:${token}`;
				const completed = new Set<string>(JSON.parse(sessionStorage.getItem(completedKey) || "[]"));
				for (const item of manifest.items as IncomingFile[]) {
					if (completed.has(item.id)) continue;
					setMessage(`Importing ${completed.size + 1} of ${manifest.items.length}: ${item.name}`);
					const download = await fetch(`http://127.0.0.1:18465${item.url}`);
					if (!download.ok) throw new Error(`File unavailable: ${item.name}`);
					const blob = await download.blob();
					const assets = await processMediaAssets({ files: [new File([blob], item.name, { type: item.mime })] });
					if (!assets.length) throw new Error(`snakeitbaby could not read ${item.name}. Open another file or format.`);
					for (const asset of assets) {
						const saved = await editor.media.addMediaAsset({ projectId, asset });
						if (!saved) throw new Error(`Could not save ${item.name} to the editor project.`);
						const seconds = saved.duration ?? 5;
						const start = saved.type === "audio" ? 0 : mediaTimeToSeconds({ time: editor.timeline.getTotalDuration() });
						editor.timeline.insertElement({
							element: buildElementFromMedia({ mediaId: saved.id, mediaType: saved.type, name: saved.name,
								duration: mediaTimeFromSeconds({ seconds }), startTime: mediaTimeFromSeconds({ seconds: start }) }),
							placement: { mode: "auto" },
						});
					}
					await editor.project.saveCurrentProject();
					completed.add(item.id);
					sessionStorage.setItem(completedKey, JSON.stringify([...completed]));
				}
				router.replace(`/editor/${projectId}`);
			} catch (error) {
				setError(true);
				setMessage(error instanceof Error ? error.message : "Could not import the Meduza selection.");
			}
		}
		void openSelection();
	}, [router]);

	return <main className="max-w-2xl mx-auto p-10 flex flex-col gap-5">
		<h1 className="text-2xl font-semibold">snakeitbaby · Meduza</h1>
		<p role="status">{message}</p>
		{error && <button className="border p-3 rounded" onClick={() => window.location.reload()}>Retry import</button>}
		<a className="underline" href="http://127.0.0.1:18465/#/studio">Back to Meduza media library</a>
	</main>;
}
