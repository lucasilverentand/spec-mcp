import { type Constitution, ConstitutionSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager";

export function createConstitutionsManager(
	specsPath: string,
): EntityManager<Constitution> {
	return new EntityManager<Constitution>({
		folderPath: specsPath,
		subFolder: "constitutions",
		idPrefix: "cns",
		entityType: "constitution",
		schema: ConstitutionSchema,
	});
}
