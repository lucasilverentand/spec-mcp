import { type Component, ComponentSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../entity-manager.js";

export function createComponentsManager(
	specsPath: string,
): EntityManager<Component> {
	return new EntityManager<Component>({
		folderPath: specsPath,
		subFolder: "components",
		idPrefix: "cmp",
		entityType: "component",
		schema: ComponentSchema,
	});
}
