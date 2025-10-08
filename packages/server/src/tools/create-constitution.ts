import type { Constitution } from "@spec-mcp/schemas";
import {
	ConstitutionDraftManager,
	FileManager,
	SpecManager,
} from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Create a constitution from a completed draft
 */
export async function createConstitutionTool(
	draft_id: string,
	additionalData?: Record<string, unknown>,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	constitution?: Constitution;
	entity_id?: string;
	message?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id }, "Creating constitution from draft");

		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		const fileManager = new FileManager(specsPath);
		const draftManager = new ConstitutionDraftManager(fileManager);
		const specManager = new SpecManager(specsPath);

		const draft = await draftManager.getDraft(draft_id);
		if (!draft) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		if (draft.type !== "constitution") {
			return {
				success: false,
				error: `Draft type mismatch. Expected "constitution", got "${draft.type}"`,
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

		const constitutionData = await draftManager.createFromDraft(draft_id);

		const finalData = {
			...constitutionData,
			...additionalData,
		};

		const constitution = await specManager.constitutions.create(finalData);
		await draftManager.deleteDraft(draft_id);

		const entityId = `con-${String(constitution.number).padStart(3, "0")}-${constitution.slug}`;

		logger.info({ entityId, draft_id }, "Constitution created successfully");

		return {
			success: true,
			constitution,
			entity_id: entityId,
			message: `Constitution created successfully: ${entityId}`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to create constitution");
		return {
			success: false,
			error: `Failed to create constitution: ${errorMessage}`,
		};
	}
}
