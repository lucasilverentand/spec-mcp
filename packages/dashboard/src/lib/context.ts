import type { DraftStore, SpecManager } from "@spec-mcp/core";

/**
 * Global context for dashboard server instances
 * This is set when the dashboard server is started
 */
export let specManager: SpecManager | null = null;
export let draftStore: DraftStore | null = null;

export function setDashboardContext(
	manager: SpecManager,
	store: DraftStore,
): void {
	specManager = manager;
	draftStore = store;
}

export function getDashboardContext(): {
	specManager: SpecManager;
	draftStore: DraftStore;
} {
	if (!specManager || !draftStore) {
		throw new Error(
			"Dashboard context not initialized. Make sure the dashboard server is started properly.",
		);
	}
	return { specManager, draftStore };
}
