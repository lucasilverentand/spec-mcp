import {
	type BusinessRequirement,
	BusinessRequirementSchema,
} from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager.js";

export function createBusinessRequirementsManager(
	specsPath: string,
): EntityManager<BusinessRequirement> {
	return new EntityManager<BusinessRequirement>({
		folderPath: specsPath,
		subFolder: "requirements/business",
		idPrefix: "brd",
		entityType: "business-requirement",
		schema: BusinessRequirementSchema,
	});
}
