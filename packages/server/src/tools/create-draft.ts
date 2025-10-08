import type { EntityType } from "@spec-mcp/schemas";
import {
	ComponentDraftManager,
	ConstitutionDraftManager,
	DecisionDraftManager,
	FileManager,
	PlanDraftManager,
	RequirementDraftManager,
} from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Create a new draft for an entity
 * This starts the Q&A creation flow
 */
export async function createDraftTool(
	type: EntityType,
	name: string,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	draft_id?: string;
	first_question?: string;
	total_questions?: number;
	guidance?: string;
	error?: string;
}> {
	try {
		logger.info({ type, name }, "Creating draft");

		// Validate type
		const validTypes = [
			"requirement",
			"component",
			"plan",
			"constitution",
			"decision",
		];
		if (!validTypes.includes(type)) {
			return {
				success: false,
				error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
			};
		}

		// Initialize file manager
		const fileManager = new FileManager(specsPath);

		// Get the appropriate draft manager for this entity type
		let draftManager:
			| RequirementDraftManager
			| ComponentDraftManager
			| PlanDraftManager
			| ConstitutionDraftManager
			| DecisionDraftManager;

		switch (type) {
			case "requirement":
				draftManager = new RequirementDraftManager(fileManager);
				break;
			case "component":
				draftManager = new ComponentDraftManager(fileManager);
				break;
			case "plan":
				draftManager = new PlanDraftManager(fileManager);
				break;
			case "constitution":
				draftManager = new ConstitutionDraftManager(fileManager);
				break;
			case "decision":
				draftManager = new DecisionDraftManager(fileManager);
				break;
			default:
				return {
					success: false,
					error: `Unsupported entity type: ${type}`,
				};
		}

		// Create the draft using the type-specific manager
		const result = await draftManager.createDraft(name);

		const guidance = `
**Draft Created Successfully!**

You are now starting the creation process for a new ${type}.

**Next Steps:**
1. Answer the following question by calling \`submit_draft_answer\`
2. Continue answering each question one by one
3. When all questions are complete, you'll be instructed to finalize

**Important:**
- Answer each question thoroughly and accurately
- You cannot skip questions - they must be answered in order
- Use the draft_id "${result.draftId}" for all subsequent calls
`;

		logger.info({ draftId: result.draftId }, "Draft created successfully");

		return {
			success: true,
			draft_id: result.draftId,
			first_question: result.firstQuestion,
			total_questions: result.totalQuestions,
			guidance,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, type, name }, "Failed to create draft");
		return {
			success: false,
			error: `Failed to create draft: ${errorMessage}`,
		};
	}
}
