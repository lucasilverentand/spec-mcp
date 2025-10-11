import { type Milestone, MilestoneSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager.js";

export function createMilestonesManager(
	specsPath: string,
): EntityManager<Milestone> {
	return new EntityManager<Milestone>({
		folderPath: specsPath,
		subFolder: "milestones",
		idPrefix: "mls",
		entityType: "milestone",
		schema: MilestoneSchema,
	});
}
