import type { Plan } from "@spec-mcp/schemas";
import { FileManager, PlanDraftManager, SpecManager } from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Create a plan from a completed draft
 */
export async function createPlanTool(
	draft_id: string,
	additionalData?: Record<string, unknown>,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	plan?: Plan;
	entity_id?: string;
	message?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id }, "Creating plan from draft");

		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		const fileManager = new FileManager(specsPath);
		const draftManager = new PlanDraftManager(fileManager);
		const specManager = new SpecManager(specsPath);

		const draft = await draftManager.getDraft(draft_id);
		if (!draft) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		if (draft.type !== "plan") {
			return {
				success: false,
				error: `Draft type mismatch. Expected "plan", got "${draft.type}"`,
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

		const planData = await draftManager.createFromDraft(draft_id);

		const finalData = {
			...planData,
			...additionalData,
		};

		const plan = await specManager.plans.create(finalData);
		await draftManager.deleteDraft(draft_id);

		const entityId = `pln-${String(plan.number).padStart(3, "0")}-${plan.slug}`;

		logger.info({ entityId, draft_id }, "Plan created successfully");

		return {
			success: true,
			plan,
			entity_id: entityId,
			message: `Plan created successfully: ${entityId}`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to create plan");
		return {
			success: false,
			error: `Failed to create plan: ${errorMessage}`,
		};
	}
}
