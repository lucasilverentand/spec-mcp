import { type Plan, PlanSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager";

export function createPlansManager(specsPath: string): EntityManager<Plan> {
	return new EntityManager<Plan>({
		folderPath: specsPath,
		subFolder: "plans",
		idPrefix: "pln",
		entityType: "plan",
		schema: PlanSchema,
	});
}
