"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface LibraryFile {
	id: string;
	name: string;
	kind: string;
	bytes: number;
	mime: string;
	url: string;
}

interface LibraryListing {
	items: LibraryFile[];
	total: number;
	scanning: boolean;
	sources: { id: string; name: string }[];
}

export function MeduzaLibrary({ onImport }: { onImport: (options: { files: File[] }) => Promise<void> }) {
	const [open, setOpen] = useState(false);
	const [listing, setListing] = useState<LibraryListing | null>(null);
	const [source, setSource] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [selected, setSelected] = useState<Map<string, LibraryFile>>(new Map());
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);
	const [refresh, setRefresh] = useState(0);

	useEffect(() => {
		if (!open) return;
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const query = new URLSearchParams({ source, search, page: String(page) });
				const response = await fetch(`/meduza-backend/api/library?${query}`, { signal: controller.signal });
				if (!response.ok) throw new Error("Start the Meduza media service to browse configured sources.");
				setListing(await response.json());
			} catch (error) {
				if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load the library.");
			}
		}, 200);
		return () => { clearTimeout(timer); controller.abort(); };
	}, [open, source, search, page, refresh]);

	async function importSelection() {
		setBusy(true);
		let completed = 0;
		try {
			for (const item of selected.values()) {
				setMessage(`Importing ${completed + 1} of ${selected.size}: ${item.name}`);
				const response = await fetch(`http://127.0.0.1:18465${item.url}`);
				if (!response.ok) throw new Error(`File unavailable: ${item.name}`);
				const blob = await response.blob();
				await onImport({ files: [new File([blob], item.name, { type: item.mime })] });
				completed += 1;
				setSelected((previous) => {
					const next = new Map(previous);
					next.delete(item.id);
					return next;
				});
			}
			setSelected(new Map());
			setMessage(`${completed} file(s) imported into this project. Drag them onto the timeline to edit.`);
			setOpen(false);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Import failed.");
		} finally {
			setBusy(false);
		}
	}

	return <>
		<Button variant="outline" size="sm" onClick={() => setOpen(true)}>Meduza library</Button>
		<Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Meduza media library</DialogTitle>
					<DialogDescription>Import clips from configured PC folders, Telegram downloads, and linked sources.</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3 p-5 min-h-0">
					<div className="flex gap-2 flex-wrap">
						<select aria-label="Media source" className="bg-background border rounded p-2" value={source} onChange={(event) => { setSource(event.target.value); setPage(0); }}>
							<option value="">All locations</option>
							{listing?.sources.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
						</select>
						<input aria-label="Search Meduza media" placeholder="Search files" className="bg-background border rounded p-2 flex-1" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
						<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
					</div>
					<p className="text-sm text-muted-foreground">{listing?.total ?? 0} files{listing?.scanning ? " · Scanning sources…" : ""} · {selected.size} selected</p>
					<div className="max-h-[45vh] overflow-auto border rounded divide-y">
						{listing?.items.map((item) => <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer">
							<input type="checkbox" disabled={busy} checked={selected.has(item.id)} onChange={(event) => setSelected((previous) => {
								const next = new Map(previous);
								if (event.target.checked) next.set(item.id, item); else next.delete(item.id);
								return next;
							})} />
							<span className="flex-1 min-w-0 break-all text-sm">{item.name}<small className="block text-muted-foreground">{item.kind} · {(item.bytes / 1024 / 1024).toFixed(1)} MB</small></span>
						</label>)}
						{listing && !listing.items.length && <p className="p-4 text-sm">No matching files. Configure another location from Meduza Studio.</p>}
					</div>
					<p role="status" className="text-sm break-all">{message}</p>
					<div className="flex items-center justify-between gap-2">
						<div className="flex gap-2"><Button variant="outline" disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={!listing || (page + 1) * 60 >= listing.total || busy} onClick={() => setPage(page + 1)}>Next</Button></div>
						<Button disabled={busy || !selected.size} onClick={importSelection}>{busy ? "Importing…" : `Import ${selected.size} selected`}</Button>
					</div>
					<a className="text-sm underline" href="http://127.0.0.1:18465/#/studio" target="_blank" rel="noreferrer">Manage folders and drive links in Meduza</a>
				</div>
			</DialogContent>
		</Dialog>
	</>;
}
