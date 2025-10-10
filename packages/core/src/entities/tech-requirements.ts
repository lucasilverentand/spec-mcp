import {
	type TechnicalRequirement,
	TechnicalRequirementSchema,
} from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager";

export function createTechRequirementsManager(
	specsPath: string,
): EntityManager<TechnicalRequirement> {
	return new EntityManager<TechnicalRequirement>({
		folderPath: specsPath,
		subFolder: "requirements/technical",
		idPrefix: "trq",
		entityType: "technical-requirement",
		schema: TechnicalRequirementSchema,
	});
}
