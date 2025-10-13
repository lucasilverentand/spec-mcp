import { type Decision, DecisionSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager.js";

export function createDecisionsManager(
	specsPath: string,
): EntityManager<Decision> {
	return new EntityManager<Decision>({
		folderPath: specsPath,
		subFolder: "decisions",
		idPrefix: "dec",
		entityType: "decision",
		schema: DecisionSchema,
	});
}
