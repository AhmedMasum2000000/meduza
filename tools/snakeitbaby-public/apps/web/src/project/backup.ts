import type { MediaAsset } from "@/media/types";
import type { TProject } from "@/project/types";
import { CURRENT_PROJECT_VERSION } from "@/services/storage/migrations";
import { storageService } from "@/services/storage/service";
import type { SerializedProject } from "@/services/storage/types";

const maxManifestBytes = 32 * 1024 * 1024;
const format = "snakeitbaby-project-v1";
type AssetEntry = Omit<MediaAsset, "file" | "url"> & {
    size: number;
    mime: string;
    lastModified: number;
};

function assertBackup(condition: unknown): asserts condition {
    if (!condition) throw new Error("This file is not a valid Snakeitbaby project backup.");
}

export async function downloadProjectBackup(projectId: string) {
    const saved = await storageService.loadProject({ id: projectId });
    if (!saved) throw new Error("Project could not be opened.");
    const assets = await storageService.loadAllMediaAssets({ projectId });
    try {
        const entries = assets.map(({ file, url: _url, ...metadata }) => ({
            ...metadata, thumbnailUrl: undefined,
            size: file.size, mime: file.type, lastModified: file.lastModified,
        }));
        const manifest = new TextEncoder().encode(JSON.stringify({ format, project: saved.project, assets: entries }));
        if (manifest.length > maxManifestBytes) throw new Error("The project metadata is too large to back up.");
        const prefix = new Uint8Array(4);
        new DataView(prefix.buffer).setUint32(0, manifest.length);
        const url = URL.createObjectURL(new Blob([prefix, manifest, ...assets.map(({ file }) => file)]));
        const link = document.createElement("a");
        link.href = url;
        link.download = (saved.project.metadata.name.replace(/[<>:"/\\|?*]/g, "_") || "Project") + ".snakeitbaby";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
        for (const asset of assets) if (asset.url) URL.revokeObjectURL(asset.url);
    }
}

export async function restoreProjectBackup(file: File) {
    assertBackup(file.size >= 4);
    const header = new DataView(await file.slice(0, 4).arrayBuffer());
    const length = header.getUint32(0);
    assertBackup(length > 0 && length <= maxManifestBytes && length <= file.size - 4);
    const data = JSON.parse(await file.slice(4, 4 + length).text());
    assertBackup(data?.format === format && Array.isArray(data.assets));
    const project: SerializedProject = data.project;
    assertBackup(project?.metadata && typeof project.metadata.name === "string");
    if (project.version !== CURRENT_PROJECT_VERSION) {
        throw new Error("This backup uses a different project version. Open it with the editor version that created it.");
    }
    assertBackup(Array.isArray(project.scenes) && project.scenes.length &&
        project.scenes.some((scene) => scene?.id === project.currentSceneId) &&
        Number.isFinite(project.settings?.canvasSize?.width) && project.settings.canvasSize.width > 0 &&
        Number.isFinite(project.settings?.canvasSize?.height) && project.settings.canvasSize.height > 0);
    for (const scene of project.scenes) {
        assertBackup(typeof scene?.id === "string" && Array.isArray(scene.tracks?.main?.elements) &&
            Array.isArray(scene.tracks?.overlay) && Array.isArray(scene.tracks?.audio) &&
            [...scene.tracks.overlay, ...scene.tracks.audio].every((track) => Array.isArray(track?.elements)));
    }
    let offset = 4 + length;
    const ids = new Set<string>();
    const assets: MediaAsset[] = data.assets.map((entry: AssetEntry) => {
        assertBackup(typeof entry?.id === "string" && /^[a-zA-Z0-9_-]+$/.test(entry.id) &&
            !ids.has(entry.id) && ["image", "audio", "video"].includes(entry.type) &&
            typeof entry.name === "string" && typeof entry.mime === "string" &&
            Number.isSafeInteger(entry.size) && entry.size > 0 && entry.size <= file.size - offset);
        ids.add(entry.id);
        const bytes = file.slice(offset, offset + entry.size);
        offset += entry.size;
        return {
            id: entry.id, name: entry.name, type: entry.type,
            file: new File([bytes], entry.name, { type: entry.mime, lastModified: entry.lastModified }),
            width: entry.width, height: entry.height, duration: entry.duration,
            ephemeral: entry.ephemeral,
        };
    });
    assertBackup(offset === file.size);
    const id = crypto.randomUUID();
    const now = new Date();
    const restored: TProject = {
        ...project,
        metadata: { ...project.metadata, id, createdAt: now, updatedAt: now },
        scenes: project.scenes.map((scene) => ({ ...scene, createdAt: now, updatedAt: now })),
    };
    try {
        for (const mediaAsset of assets) await storageService.saveMediaAsset({ projectId: id, mediaAsset });
        await storageService.saveProject({ project: restored });
    } catch (error) {
        await Promise.allSettled([storageService.deleteProject({ id }), storageService.deleteProjectMedia({ projectId: id })]);
        throw error;
    }
    return id;
}
