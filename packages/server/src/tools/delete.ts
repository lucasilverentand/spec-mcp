import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DraftStore, SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Component,
	Decision,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { getIdType, parseEntityId, parseItemId } from "@spec-mcp/utils";

/**
 * Determine entity type from ID prefix
 */
function getEntityTypeFromId(id: string): {
	isSpec: boolean;
	isDraft: boolean;
	specType?: string;
	itemType?: string;
} {
	const idType = getIdType(id);

	if (idType === "draft") {
		return { isSpec: false, isDraft: true };
	}

	if (idType === "entity") {
		const parsed = parseEntityId(id);
		if (parsed?.entityType) {
			return {
				isSpec: true,
				isDraft: false,
				specType: parsed.entityType,
			};
		}
	}

	if (idType === "item") {
		const parsed = parseItemId(id);
		if (parsed?.itemType) {
			return {
				isSpec: false,
				isDraft: false,
				itemType: parsed.itemType,
			};
		}
	}

	return { isSpec: false, isDraft: false };
}

/**
 * Get the array field name, item type, and spec type from an item ID prefix
 */
function getArrayFieldFromItemId(itemId: string): {
	fieldName: string;
	itemType: string;
	supportedSpecTypes: string[];
} | null {
	const parts = itemId.split("-");
	const prefix = parts[0];

	if (!prefix) {
		return null;
	}

	const fieldMap: Record<
		string,
		{ fieldName: string; itemType: string; supportedSpecTypes: string[] }
	> = {
		// Plan items
		task: {
			fieldName: "tasks",
			itemType: "task",
			supportedSpecTypes: ["plan"],
		},
		test: {
			fieldName: "test_cases",
			itemType: "test case",
			supportedSpecTypes: ["plan"],
		},
		flow: {
			fieldName: "flows",
			itemType: "flow",
			supportedSpecTypes: ["plan"],
		},
		api: {
			fieldName: "api_contracts",
			itemType: "API contract",
			supportedSpecTypes: ["plan"],
		},
		data: {
			fieldName: "data_models",
			itemType: "data model",
			supportedSpecTypes: ["plan"],
		},
		// Requirement items
		crit: {
			fieldName: "criteria",
			itemType: "criteria",
			supportedSpecTypes: ["business-requirement", "technical-requirement"],
		},
	};

	return fieldMap[prefix] || null;
}

/**
 * Unified delete tool that can delete specs, nested items, and drafts by their globally unique IDs
 */
export async function deleteEntity(
	specManager: SpecManager,
	id: string,
	draftStore?: DraftStore,
): Promise<CallToolResult> {
	try {
		const entityInfo = getEntityTypeFromId(id);

		if (entityInfo.isDraft) {
			// It's a draft - delete the draft session
			if (!draftStore) {
				return {
					content: [
						{
							type: "text",
							text: `Cannot delete draft: draft store not available`,
						},
					],
					isError: true,
				};
			}
			return await deleteDraft(draftStore, id);
		}

		if (entityInfo.isSpec) {
			// It's a spec - delete the entire spec file
			return await deleteSpec(specManager, id);
		}

		if (entityInfo.itemType) {
			// It's a nested item - find the parent spec and delete the item
			return await deleteNestedItem(specManager, id, entityInfo.itemType);
		}

		return {
			content: [
				{
					type: "text",
					text: `Unknown entity type for ID: ${id}. Supported spec prefixes: pln, brd, prd, dec, cmp, cst. Supported item prefixes: task, crit, test, flow, api, data. Draft format: {type}-draft-{number}`,
				},
			],
			isError: true,
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error deleting entity: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Delete a draft session
 */
async function deleteDraft(
	draftStore: DraftStore,
	draftId: string,
): Promise<CallToolResult> {
	// Check if draft exists
	if (!draftStore.has(draftId)) {
		return {
			content: [
				{
					type: "text",
					text: `Draft '${draftId}' not found. Use list_drafts to see all active drafts.`,
				},
			],
			isError: true,
		};
	}

	// Delete the draft from memory and disk
	const deleted = await draftStore.deleteWithFile(draftId);

	if (!deleted) {
		return {
			content: [
				{
					type: "text",
					text: `Failed to delete draft '${draftId}'.`,
				},
			],
			isError: true,
		};
	}

	return {
		content: [
			{
				type: "text",
				text: `Successfully deleted draft ${draftId}. The draft has been removed from active sessions.`,
			},
		],
	};
}

/**
 * Delete a spec file
 */
async function deleteSpec(
	specManager: SpecManager,
	specId: string,
): Promise<CallToolResult> {
	// Validate and find the entity
	const result = await validateEntity(specManager, specId);

	if (!result.valid || !result.entity) {
		return {
			content: [
				{
					type: "text",
					text: `Failed to delete entity: ${result.errors?.join(", ") || "Entity not found"}`,
				},
			],
			isError: true,
		};
	}

	const entity = result.entity;
	const entityType = entity.type;

	// Get the appropriate manager
	const manager =
		entityType === "business-requirement"
			? specManager.business_requirements
			: entityType === "technical-requirement"
				? specManager.tech_requirements
				: entityType === "plan"
					? specManager.plans
					: entityType === "component"
						? specManager.components
						: entityType === "constitution"
							? specManager.constitutions
							: specManager.decisions;

	// Delete the entity
	await manager.deleteEntity(entity.number);

	return {
		content: [
			{
				type: "text",
				text: `Successfully deleted ${entityType} ${entity.number}: ${entity.name}`,
			},
		],
	};
}

/**
 * Delete a nested item from a spec's array by finding which spec contains it
 */
async function deleteNestedItem(
	specManager: SpecManager,
	itemId: string,
	_itemTypeName: string,
): Promise<CallToolResult> {
	// Determine what type of item we're deleting based on item ID
	const arrayInfo = getArrayFieldFromItemId(itemId);

	if (!arrayInfo) {
		return {
			content: [
				{
					type: "text",
					text: `Unknown item type from ID: ${itemId}. Supported prefixes: task, crit, test, flow, api, data`,
				},
			],
			isError: true,
		};
	}

	// Find the spec that contains this item
	const parentSpec = await findSpecContainingItem(
		specManager,
		itemId,
		arrayInfo,
	);

	if (!parentSpec) {
		return {
			content: [
				{
					type: "text",
					text: `Could not find any spec containing ${arrayInfo.itemType} ${itemId}`,
				},
			],
			isError: true,
		};
	}

	// Validate spec type matches item type
	if (!arrayInfo.supportedSpecTypes.includes(parentSpec.type)) {
		return {
			content: [
				{
					type: "text",
					text: `Cannot delete ${arrayInfo.itemType} from ${parentSpec.type}. ${arrayInfo.itemType} can only be deleted from: ${arrayInfo.supportedSpecTypes.join(", ")}`,
				},
			],
			isError: true,
		};
	}

	// Handle different item types
	switch (arrayInfo.fieldName) {
		case "tasks":
			return deleteTask(
				specManager,
				parentSpec as Plan,
				itemId,
				arrayInfo.itemType,
			);
		case "criteria":
			return deleteCriteria(
				specManager,
				parentSpec as BusinessRequirement | TechnicalRequirement,
				itemId,
				arrayInfo.itemType,
			);
		case "test_cases":
		case "flows":
		case "api_contracts":
		case "data_models":
			return deleteArrayItem(
				specManager,
				parentSpec as Plan,
				itemId,
				arrayInfo.fieldName,
				arrayInfo.itemType,
			);
		default:
			return {
				content: [
					{
						type: "text",
						text: `Array field ${arrayInfo.fieldName} not yet supported for deletion`,
					},
				],
				isError: true,
			};
	}
}

/**
 * Find which spec contains a given item ID
 */
async function findSpecContainingItem(
	specManager: SpecManager,
	itemId: string,
	arrayInfo: {
		fieldName: string;
		itemType: string;
		supportedSpecTypes: string[];
	},
): Promise<
	| Plan
	| BusinessRequirement
	| TechnicalRequirement
	| Decision
	| Component
	| null
> {
	// Search through appropriate spec types
	for (const specType of arrayInfo.supportedSpecTypes) {
		let manager:
			| typeof specManager.plans
			| typeof specManager.business_requirements
			| typeof specManager.tech_requirements
			| typeof specManager.decisions
			| typeof specManager.components;
		switch (specType) {
			case "plan":
				manager = specManager.plans;
				break;
			case "business-requirement":
				manager = specManager.business_requirements;
				break;
			case "technical-requirement":
				manager = specManager.tech_requirements;
				break;
			case "decision":
				manager = specManager.decisions;
				break;
			case "component":
				manager = specManager.components;
				break;
			default:
				continue;
		}

		// Get all entities of this type
		const entities = await manager.list();

		// Search for the item in each entity
		for (const entity of entities) {
			const array =
				(entity[arrayInfo.fieldName as keyof typeof entity] as unknown as
					| Array<{ id: string }>
					| undefined) || [];

			if (array.some((item) => item.id === itemId)) {
				return entity as Plan | BusinessRequirement | TechnicalRequirement;
			}
		}
	}

	return null;
}

/**
 * Delete a task from a plan
 */
async function deleteTask(
	specManager: SpecManager,
	plan: Plan,
	taskId: string,
	itemType: string,
): Promise<CallToolResult> {
	if (plan.type !== "plan") {
		return {
			content: [
				{
					type: "text",
					text: `Entity is not a plan (found: ${plan.type})`,
				},
			],
			isError: true,
		};
	}

	const existingTasks = plan.tasks || [];
	const taskIndex = existingTasks.findIndex((t) => t.id === taskId);

	if (taskIndex === -1) {
		return {
			content: [
				{
					type: "text",
					text: `Task ${taskId} not found in plan`,
				},
			],
			isError: true,
		};
	}

	// Check if other tasks depend on this task
	const dependentTasks = existingTasks.filter((t) =>
		t.depends_on?.includes(taskId),
	);

	if (dependentTasks.length > 0) {
		const dependentIds = dependentTasks.map((t) => t.id).join(", ");
		return {
			content: [
				{
					type: "text",
					text: `Cannot delete task ${taskId}: other tasks depend on it (${dependentIds})`,
				},
			],
			isError: true,
		};
	}

	const taskDescription = existingTasks[taskIndex]!.task;
	const updatedTasks = existingTasks.filter((t) => t.id !== taskId);

	await specManager.plans.update(plan.number, {
		tasks: updatedTasks,
	});

	return {
		content: [
			{
				type: "text",
				text: `Successfully deleted ${itemType} ${taskId}: ${taskDescription}`,
			},
		],
	};
}

/**
 * Delete criteria from a business or technical requirement
 */
async function deleteCriteria(
	specManager: SpecManager,
	spec: BusinessRequirement | TechnicalRequirement,
	criteriaId: string,
	itemType: string,
): Promise<CallToolResult> {
	const existingCriteria = spec.criteria || [];
	const criteriaIndex = existingCriteria.findIndex((c) => c.id === criteriaId);

	if (criteriaIndex === -1) {
		return {
			content: [
				{
					type: "text",
					text: `Criteria ${criteriaId} not found in ${spec.type}`,
				},
			],
			isError: true,
		};
	}

	const criteriaDescription = existingCriteria[criteriaIndex]!.description;
	const updatedCriteria = existingCriteria.filter((c) => c.id !== criteriaId);

	const manager =
		spec.type === "business-requirement"
			? specManager.business_requirements
			: specManager.tech_requirements;

	await manager.update(spec.number, {
		criteria: updatedCriteria,
	});

	return {
		content: [
			{
				type: "text",
				text: `Successfully deleted ${itemType} ${criteriaId}: ${criteriaDescription}`,
			},
		],
	};
}

/**
 * Delete a generic array item (test cases, flows, API contracts, data models)
 */
async function deleteArrayItem(
	specManager: SpecManager,
	plan: Plan,
	itemId: string,
	fieldName: string,
	itemType: string,
): Promise<CallToolResult> {
	if (plan.type !== "plan") {
		return {
			content: [
				{
					type: "text",
					text: `Entity is not a plan (found: ${plan.type})`,
				},
			],
			isError: true,
		};
	}

	// Get the array
	const array = (plan[fieldName as keyof Plan] as Array<{ id: string }>) || [];
	const itemIndex = array.findIndex((item) => item.id === itemId);

	if (itemIndex === -1) {
		return {
			content: [
				{
					type: "text",
					text: `${itemType} ${itemId} not found in plan`,
				},
			],
			isError: true,
		};
	}

	const updatedArray = array.filter((item) => item.id !== itemId);

	await specManager.plans.update(plan.number, {
		[fieldName]: updatedArray,
	});

	return {
		content: [
			{
				type: "text",
				text: `Successfully deleted ${itemType} ${itemId}`,
			},
		],
	};
}

export const deleteTool = {
	name: "delete",
	description:
		"Delete any entity by its globally unique ID. Can delete specs (e.g., 'pln-001'), nested items (e.g., 'task-001'), or draft sessions (e.g., 'pln-draft-001'). All IDs are globally unique - the tool automatically finds and deletes the entity. This permanently removes the entity, item, or draft.",
	inputSchema: {
		type: "object",
		properties: {
			id: {
				type: "string",
				description:
					"Globally unique identifier. Specs: 'pln-001', 'brd-002-user-auth'. Items: 'task-001', 'crit-003', 'test-002', 'flow-001', 'api-004', 'data-005'. Drafts: 'pln-draft-001', 'brd-draft-002'",
			},
		},
		required: ["id"],
	} as const,
};
