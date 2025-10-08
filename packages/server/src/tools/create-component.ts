import {
	ComponentDraftManager,
	FileManager,
	SpecManager,
} from "@spec-mcp/core";
import type { Component } from "@spec-mcp/schemas";
import { logger } from "../utils/logger.js";

/**
 * Create a component from a completed draft
 */
export async function createComponentTool(
	draft_id: string,
	additionalData?: Record<string, unknown>,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	component?: Component;
	entity_id?: string;
	message?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id }, "Creating component from draft");

		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		const fileManager = new FileManager(specsPath);
		const draftManager = new ComponentDraftManager(fileManager);
		const specManager = new SpecManager(specsPath);

		const draft = await draftManager.getDraft(draft_id);
		if (!draft) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		if (draft.type !== "component") {
			return {
				success: false,
				error: `Draft type mismatch. Expected "component", got "${draft.type}"`,
			};
		}

		const isComplete = await draftManager.isComplete(draft_id);
		if (!isComplete) {
			const remaining = draft.questions.length - draft.currentQuestionIndex;
			return {
				success: false,
				error: `Draft is not complete. ${remaining} questions remaining.`,
			};
		}

		const componentData = await draftManager.createFromDraft(draft_id);

		const finalData = {
			...componentData,
			...additionalData,
		};

		const component = await specManager.components.create(finalData);
		await draftManager.deleteDraft(draft_id);

		const entityId = `cmp-${String(component.number).padStart(3, "0")}-${component.slug}`;

		logger.info({ entityId, draft_id }, "Component created successfully");

		return {
			success: true,
			component,
			entity_id: entityId,
			message: `Component created successfully: ${entityId}`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to create component");
		return {
			success: false,
			error: `Failed to create component: ${errorMessage}`,
		};
	}
}
