import type { Decision } from "@spec-mcp/schemas";
import { DecisionSchema } from "@spec-mcp/schemas";
import { DecisionDraftManager, FileManager, SpecManager } from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Create a decision from a completed draft
 */
export async function createDecisionTool(
	draft_id: string,
	additionalData?: Partial<Decision>,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	decision?: Decision;
	entity_id?: string;
	message?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id }, "Creating decision from draft");

		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		const fileManager = new FileManager(specsPath);
		const draftManager = new DecisionDraftManager(fileManager);
		const specManager = new SpecManager(specsPath);

		const draft = await draftManager.getDraft(draft_id);
		if (!draft) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		if (draft.type !== "decision") {
			return {
				success: false,
				error: `Draft type mismatch. Expected "decision", got "${draft.type}"`,
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

		// Validate additional data if provided
		if (additionalData) {
			const validationResult =
				DecisionSchema.partial().safeParse(additionalData);
			if (!validationResult.success) {
				return {
					success: false,
					error: `Invalid additional data: ${validationResult.error.message}`,
				};
			}
		}

		const decisionData = await draftManager.createFromDraft(draft_id);

		const finalData = {
			...decisionData,
			...additionalData,
		};

		const decision = await specManager.decisions.create(finalData);
		await draftManager.deleteDraft(draft_id);

		const entityId = `dec-${String(decision.number).padStart(3, "0")}-${decision.slug}`;

		logger.info({ entityId, draft_id }, "Decision created successfully");

		return {
			success: true,
			decision,
			entity_id: entityId,
			message: `Decision created successfully: ${entityId}`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to create decision");
		return {
			success: false,
			error: `Failed to create decision: ${errorMessage}`,
		};
	}
}
