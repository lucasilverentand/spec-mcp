import { type Constitution, ConstitutionSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager.js";

export function createConstitutionsManager(
	specsPath: string,
): EntityManager<Constitution> {
	return new EntityManager<Constitution>({
		folderPath: specsPath,
		subFolder: "constitutions",
		idPrefix: "con",
		entityType: "constitution",
		schema: ConstitutionSchema,
	});
}
