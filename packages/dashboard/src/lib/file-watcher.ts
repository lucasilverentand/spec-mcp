import chokidar, { type FSWatcher } from "chokidar";
import { getSpecsDirectory } from "./fs-reader";

type ChangeCallback = (event: {
	type:
		| "spec:created"
		| "spec:updated"
		| "spec:deleted"
		| "draft:created"
		| "draft:updated"
		| "draft:finalized";
	path: string;
}) => void;

let watcherInstance: FSWatcher | null = null;
const callbacks = new Set<ChangeCallback>();

export function startFileWatcher() {
	if (watcherInstance) {
		return watcherInstance;
	}

	const specsDir = getSpecsDirectory();
	console.log(`[FileWatcher] Watching specs directory: ${specsDir}`);

	watcherInstance = chokidar.watch(specsDir, {
		ignored: /(^|[/\\])\../, // ignore dotfiles
		persistent: true,
		ignoreInitial: true,
	});

	watcherInstance
		.on("add", (path: string) => {
			console.log(`[FileWatcher] File added: ${path}`);
			const event = path.includes("draft") ? "draft:created" : "spec:created";
			notifyCallbacks({ type: event, path });
		})
		.on("change", (path: string) => {
			console.log(`[FileWatcher] File changed: ${path}`);
			const event = path.includes("draft") ? "draft:updated" : "spec:updated";
			notifyCallbacks({ type: event, path });
		})
		.on("unlink", (path: string) => {
			console.log(`[FileWatcher] File deleted: ${path}`);
			const event = "spec:deleted";
			notifyCallbacks({ type: event, path });
		});

	return watcherInstance;
}

export function stopFileWatcher() {
	if (watcherInstance) {
		watcherInstance.close();
		watcherInstance = null;
	}
}

export function onFileChange(callback: ChangeCallback) {
	callbacks.add(callback);
	return () => callbacks.delete(callback);
}

function notifyCallbacks(event: Parameters<ChangeCallback>[0]) {
	callbacks.forEach((callback) => {
		try {
			callback(event);
		} catch (error) {
			console.error("[FileWatcher] Error in callback:", error);
		}
	});
}
