import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { type Supersedable, validateEntity } from "@spec-mcp/core";
import { formatItemId, getItemType } from "@spec-mcp/utils";

/**
 * Configuration for building array manipulation tools
 */
export interface ArrayToolConfig<TSpec, TItem> {
	/** Name of the tool (e.g., "add_task") */
	toolName: string;
	/** Human-readable description */
	description: string;
	/** Spec type this tool operates on (e.g., "plan", "business-requirement") */
	specType: string;
	/** Name of the array field in the spec (e.g., "tasks", "criteria") */
	arrayFieldName: keyof TSpec;
	/** ID prefix for items (e.g., "task", "crit") */
	idPrefix: string;
	/** Function to get the array from a spec */
	getArray: (spec: TSpec) => TItem[];
	/** Function to set the array on a spec */
	setArray: (spec: TSpec, items: TItem[]) => Partial<TSpec>;
}

/**
 * Generic add tool for items with IDs
 * Automatically generates the next available ID
 * Supports superseding existing items by providing supersede_id
 */
export async function addItemWithId<
	TSpec extends { type: string; number: number },
	TItem extends { id: string } & Partial<Supersedable>,
>(
	specManager: SpecManager,
	specId: string,
	newItemData: Omit<
		TItem,
		"id" | "supersedes" | "superseded_by" | "superseded_at"
	>,
	config: ArrayToolConfig<TSpec, TItem>,
	supersede_id?: string,
): Promise<CallToolResult> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${config.specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as unknown as TSpec;

		if (spec.type !== config.specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${config.specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Get existing items
		const existingItems = config.getArray(spec);

		// If superseding, validate the old item exists and isn't already superseded
		let oldItem: TItem | undefined;
		if (supersede_id) {
			oldItem = existingItems.find((item) => item.id === supersede_id);

			if (!oldItem) {
				return {
					content: [
						{
							type: "text",
							text: `${config.idPrefix} ${supersede_id} not found in ${config.specType} ${specId}`,
						},
					],
					isError: true,
				};
			}

			// Check if already superseded
			if (
				"superseded_by" in oldItem &&
				oldItem.superseded_by !== null &&
				oldItem.superseded_by !== undefined
			) {
				return {
					content: [
						{
							type: "text",
							text: `${config.idPrefix} ${supersede_id} has already been superseded by ${oldItem.superseded_by}`,
						},
					],
					isError: true,
				};
			}
		}

		// Generate next ID
		const maxNum = existingItems.reduce((max, item) => {
			const match = item.id.match(/^[a-z]+-(\d+)$/);
			if (match) {
				const num = Number.parseInt(match[1]!, 10);
				return num > max ? num : max;
			}
			return max;
		}, 0);

		const prefix = config.idPrefix || "item";
		const itemType = getItemType(prefix);
		const newId = itemType
			? formatItemId({ itemType, number: maxNum + 1 })
			: `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
		const now = new Date().toISOString();

		// Create the new item with supersession fields
		const newItem = {
			...(supersede_id && oldItem ? oldItem : {}),
			...newItemData,
			id: newId,
			supersedes: supersede_id || null,
			superseded_by: null,
			superseded_at: null,
		} as TItem;

		let updatedItems: TItem[];

		if (supersede_id && oldItem) {
			// Mark the old item as superseded
			const updatedOldItem = {
				...oldItem,
				superseded_by: newId,
				superseded_at: now,
			} as TItem;

			// Update all references to the old ID with the new ID
			updatedItems = existingItems.map((item) => {
				if (item.id === supersede_id) {
					return updatedOldItem;
				}
				// Update references in the item
				return updateReferencesInItem(item, supersede_id, newId) as TItem;
			});

			// Add the new item
			updatedItems.push(newItem);
		} else {
			// Simple add without supersession
			updatedItems = [...existingItems, newItem];
		}

		const updates = config.setArray(spec, updatedItems);

		// Perform the update with proper type narrowing
		await performUpdate(
			specManager,
			spec.type,
			spec.number,
			updates as Record<string, unknown>,
		);

		if (supersede_id) {
			// Show what changed
			const changes: string[] = [];
			const oldItemRecord = oldItem as unknown as Record<string, unknown>;
			const newItemRecord = newItemData as unknown as Record<string, unknown>;

			for (const [key, value] of Object.entries(newItemRecord)) {
				if (
					value !== undefined &&
					value !== oldItemRecord[key] &&
					key !== "id" &&
					key !== "supersedes" &&
					key !== "superseded_by" &&
					key !== "superseded_at"
				) {
					changes.push(`- ${key} updated`);
				}
			}

			const changesSummary =
				changes.length > 0
					? `\n\nChanges:\n${changes.join("\n")}`
					: "\n\n(No field changes, item cloned with new ID)";

			return {
				content: [
					{
						type: "text",
						text: `Successfully superseded ${supersede_id} with new ${newId}${changesSummary}\n\nThe old item remains in the spec for audit trail but is marked as superseded.\n\nAll references to ${supersede_id} have been updated to ${newId}.`,
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Successfully added ${newId} to ${config.specType} ${specId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error adding ${config.idPrefix}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Update references to an old ID with a new ID in an item
 * Handles common patterns like depends_on, blocked_by, etc.
 */
function updateReferencesInItem<T>(item: T, oldId: string, newId: string): T {
	const updated = { ...item };
	const itemRecord = updated as Record<string, unknown>;

	// Update array fields that contain ID references
	const arrayFieldsWithRefs = [
		"depends_on",
		"blocked_by",
		"blocking",
		"related_to",
		"tasks",
		"criteria",
	];

	for (const field of arrayFieldsWithRefs) {
		if (
			field in itemRecord &&
			Array.isArray(itemRecord[field]) &&
			itemRecord[field]
		) {
			const arr = itemRecord[field] as string[];
			itemRecord[field] = arr.map((id) => (id === oldId ? newId : id));
		}
	}

	// Update nested blocked array (array of BlockedReason objects)
	if ("blocked" in itemRecord && Array.isArray(itemRecord.blocked)) {
		itemRecord.blocked = (
			itemRecord.blocked as Array<{ blocked_by?: string[] }>
		).map((block) => {
			if (block.blocked_by && Array.isArray(block.blocked_by)) {
				return {
					...block,
					blocked_by: block.blocked_by.map((id) => (id === oldId ? newId : id)),
				};
			}
			return block;
		});
	}

	return updated as T;
}

/**
 * Generic remove tool for items with IDs
 * Removes the item from the array completely
 */
export async function removeItemWithId<
	TSpec extends { type: string; number: number },
	TItem extends { id: string },
>(
	specManager: SpecManager,
	specId: string,
	itemId: string,
	config: ArrayToolConfig<TSpec, TItem>,
): Promise<CallToolResult> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${config.specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as unknown as TSpec;

		if (spec.type !== config.specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${config.specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Get existing items
		const existingItems = config.getArray(spec);

		// Find the item to remove
		const itemToRemove = existingItems.find((item) => item.id === itemId);

		if (!itemToRemove) {
			return {
				content: [
					{
						type: "text",
						text: `${config.idPrefix} ${itemId} not found in ${config.specType} ${specId}`,
					},
				],
				isError: true,
			};
		}

		// Remove the item
		const updatedItems = existingItems.filter((item) => item.id !== itemId);
		const updates = config.setArray(spec, updatedItems);

		// Perform the update with proper type narrowing
		await performUpdate(
			specManager,
			spec.type,
			spec.number,
			updates as Record<string, unknown>,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully removed ${itemId} from ${config.specType} ${specId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error removing ${config.idPrefix}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Generic supersede tool for items with IDs
 * Creates a new version of the item with a new ID
 */
export async function supersedeItemWithId<
	TSpec extends { type: string; number: number },
	TItem extends { id: string } & Supersedable,
>(
	specManager: SpecManager,
	specId: string,
	itemId: string,
	newItemData: Partial<
		Omit<TItem, "id" | "supersedes" | "superseded_by" | "superseded_at">
	>,
	config: ArrayToolConfig<TSpec, TItem>,
): Promise<CallToolResult> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${config.specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as unknown as TSpec;

		if (spec.type !== config.specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${config.specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Get existing items
		const existingItems = config.getArray(spec);

		// Find the item to supersede
		const oldItem = existingItems.find((item) => item.id === itemId);

		if (!oldItem) {
			return {
				content: [
					{
						type: "text",
						text: `${config.idPrefix} ${itemId} not found in ${config.specType} ${specId}`,
					},
				],
				isError: true,
			};
		}

		// Check if already superseded
		if (oldItem.superseded_by !== null) {
			return {
				content: [
					{
						type: "text",
						text: `${config.idPrefix} ${itemId} has already been superseded by ${oldItem.superseded_by}`,
					},
				],
				isError: true,
			};
		}

		// Generate next ID
		const maxNum = existingItems.reduce((max, item) => {
			const match = item.id.match(/^[a-z]+-(\d+)$/);
			if (match) {
				const num = Number.parseInt(match[1]!, 10);
				return num > max ? num : max;
			}
			return max;
		}, 0);

		const prefix = config.idPrefix || "item";
		const itemType = getItemType(prefix);
		const newId = itemType
			? formatItemId({ itemType, number: maxNum + 1 })
			: `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
		const now = new Date().toISOString();

		// Create the new item, merging old and new data
		const newItem = {
			...oldItem,
			...newItemData,
			id: newId,
			supersedes: itemId,
			superseded_by: null,
			superseded_at: null,
		} as TItem;

		// Mark the old item as superseded
		const updatedOldItem = {
			...oldItem,
			superseded_by: newId,
			superseded_at: now,
		} as TItem;

		// Update all references to the old ID with the new ID
		const updatedItems = existingItems.map((item) => {
			if (item.id === itemId) {
				return updatedOldItem;
			}
			// Update references in the item
			return updateReferencesInItem(item, itemId, newId) as TItem;
		});
		updatedItems.push(newItem);

		const updates = config.setArray(spec, updatedItems);

		// Perform the update with proper type narrowing
		await performUpdate(
			specManager,
			spec.type,
			spec.number,
			updates as Record<string, unknown>,
		);

		// Show what changed
		const changes: string[] = [];
		const oldItemRecord = oldItem as Record<string, unknown>;
		for (const [key, value] of Object.entries(newItemData)) {
			if (value !== undefined && value !== oldItemRecord[key]) {
				changes.push(`- ${key} updated`);
			}
		}

		const changesSummary =
			changes.length > 0
				? `\n\nChanges:\n${changes.join("\n")}`
				: "\n\n(No field changes, item cloned with new ID)";

		return {
			content: [
				{
					type: "text",
					text: `Successfully superseded ${itemId} with new ${newId}${changesSummary}\n\nThe old item remains in the spec for audit trail but is marked as superseded.\n\nAll references to ${itemId} have been updated to ${newId}.`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error superseding ${config.idPrefix}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Generic add tool for simple array items (no IDs)
 */
export async function addSimpleItem<
	TSpec extends { type: string; number: number },
	TItem,
>(
	specManager: SpecManager,
	specId: string,
	newItem: TItem,
	config: ArrayToolConfig<TSpec, TItem>,
): Promise<CallToolResult> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${config.specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as unknown as TSpec;

		if (spec.type !== config.specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${config.specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Get existing items
		const existingItems = config.getArray(spec);

		// Add the new item
		const updatedItems = [...existingItems, newItem];
		const updates = config.setArray(spec, updatedItems);

		// Perform the update with proper type narrowing
		await performUpdate(
			specManager,
			spec.type,
			spec.number,
			updates as Record<string, unknown>,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully added ${config.arrayFieldName as string} to ${config.specType} ${specId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error adding ${config.arrayFieldName as string}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Generic remove tool for simple array items (no IDs)
 * Removes by index
 */
export async function removeSimpleItem<
	TSpec extends { type: string; number: number },
	TItem,
>(
	specManager: SpecManager,
	specId: string,
	index: number,
	config: ArrayToolConfig<TSpec, TItem>,
): Promise<CallToolResult> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${config.specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as unknown as TSpec;

		if (spec.type !== config.specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${config.specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Get existing items
		const existingItems = config.getArray(spec);

		// Validate index
		if (index < 0 || index >= existingItems.length) {
			return {
				content: [
					{
						type: "text",
						text: `Invalid index ${index}. Must be between 0 and ${existingItems.length - 1}`,
					},
				],
				isError: true,
			};
		}

		// Remove the item
		const updatedItems = existingItems.filter((_, i) => i !== index);
		const updates = config.setArray(spec, updatedItems);

		// Perform the update with proper type narrowing
		await performUpdate(
			specManager,
			spec.type,
			spec.number,
			updates as Record<string, unknown>,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully removed ${config.arrayFieldName as string} at index ${index} from ${config.specType} ${specId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error removing ${config.arrayFieldName as string}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Helper to get the appropriate spec manager and perform an update
 * This avoids the union type issue by performing the update inline with proper narrowing
 */
async function performUpdate(
	specManager: SpecManager,
	specType: string,
	specNumber: number,
	updates: Record<string, unknown>,
): Promise<void> {
	switch (specType) {
		case "plan":
			await specManager.plans.update(
				specNumber,
				updates as Parameters<typeof specManager.plans.update>[1],
			);
			break;
		case "business-requirement":
			await specManager.business_requirements.update(
				specNumber,
				updates as Parameters<
					typeof specManager.business_requirements.update
				>[1],
			);
			break;
		case "technical-requirement":
			await specManager.tech_requirements.update(
				specNumber,
				updates as Parameters<typeof specManager.tech_requirements.update>[1],
			);
			break;
		case "decision":
			await specManager.decisions.update(
				specNumber,
				updates as Parameters<typeof specManager.decisions.update>[1],
			);
			break;
		case "component":
			await specManager.components.update(
				specNumber,
				updates as Parameters<typeof specManager.components.update>[1],
			);
			break;
		case "constitution":
			await specManager.constitutions.update(
				specNumber,
				updates as Parameters<typeof specManager.constitutions.update>[1],
			);
			break;
		case "milestone":
			await specManager.milestones.update(
				specNumber,
				updates as Parameters<typeof specManager.milestones.update>[1],
			);
			break;
		default:
			throw new Error(`Unknown spec type: ${specType}`);
	}
}
