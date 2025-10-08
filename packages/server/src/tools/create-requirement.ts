import type { Requirement } from "@spec-mcp/schemas";
import { RequirementSchema } from "@spec-mcp/schemas";
import {
	FileManager,
	RequirementDraftManager,
	SpecManager,
} from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Create a requirement from a completed draft
 */
export async function createRequirementTool(
	draft_id: string,
	additionalData?: Partial<Requirement>,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	requirement?: Requirement;
	entity_id?: string;
	message?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id }, "Creating requirement from draft");

		// Validate draft_id format
		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		// Initialize managers
		const fileManager = new FileManager(specsPath);
		const draftManager = new RequirementDraftManager(fileManager);
		const specManager = new SpecManager(specsPath);

		// Get and validate draft
		const draft = await draftManager.getDraft(draft_id);
		if (!draft) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		// Verify it's a requirement draft
		if (draft.type !== "requirement") {
			return {
				success: false,
				error: `Draft type mismatch. Expected "requirement", got "${draft.type}"`,
			};
		}

		// Check if draft is complete
		const isComplete = await draftManager.isComplete(draft_id);
		if (!isComplete) {
			const remaining = draft.questions.length - draft.currentQuestionIndex;
			return {
				success: false,
				error: `Draft is not complete. ${remaining} questions remaining. Please finish answering all questions first.`,
			};
		}

		// Validate additional data if provided
		if (additionalData) {
			const validationResult =
				RequirementSchema.partial().safeParse(additionalData);
			if (!validationResult.success) {
				return {
					success: false,
					error: `Invalid additional data: ${validationResult.error.message}`,
				};
			}
		}

		// Create requirement from the completed draft
		const requirementData = await draftManager.createFromDraft(draft_id);

		// Merge with any additional data if provided
		const finalData = {
			...requirementData,
			...additionalData,
		};

		// Create the requirement
		const requirement = await specManager.requirements.create(finalData);

		// Delete the draft
		await draftManager.deleteDraft(draft_id);

		const entityId = `req-${String(requirement.number).padStart(3, "0")}-${requirement.slug}`;

		logger.info({ entityId, draft_id }, "Requirement created successfully");

		return {
			success: true,
			requirement,
			entity_id: entityId,
			message: `Requirement created successfully: ${entityId}`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to create requirement");
		return {
			success: false,
			error: `Failed to create requirement: ${errorMessage}`,
		};
	}
}
