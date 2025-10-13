import type { EntityType, ItemType } from "@spec-mcp/schemas";

/**
 * Constants for ID formatting
 */
export const ID_NUMBER_PADDING = 3;

/**
 * Entity type to prefix mapping (single source of truth)
 * These are used in file names and IDs
 */
export const ENTITY_TYPE_TO_PREFIX: Record<EntityType, string> = {
	"business-requirement": "brd",
	"technical-requirement": "prd",
	plan: "pln",
	component: "cmp",
	constitution: "con",
	decision: "dec",
	milestone: "mls",
};

/**
 * Prefix to entity type mapping (reverse of ENTITY_TYPE_TO_PREFIX)
 */
export const PREFIX_TO_ENTITY_TYPE: Record<string, EntityType> = {
	brd: "business-requirement",
	brq: "business-requirement", // Alias (legacy)
	breq: "business-requirement", // Alias (legacy)
	prd: "technical-requirement",
	trq: "technical-requirement", // Alias (legacy)
	treq: "technical-requirement", // Alias (legacy)
	pln: "plan",
	cmp: "component",
	con: "constitution",
	cns: "constitution", // Alias (legacy)
	dec: "decision",
	dcs: "decision", // Alias (legacy)
	mls: "milestone",
};

/**
 * Item type to prefix mapping (all 3 letters for consistency)
 */
export const ITEM_TYPE_TO_PREFIX: Record<ItemType, string> = {
	task: "tsk",
	criteria: "crt",
	"test-case": "tst",
	flow: "flw",
	"api-contract": "api",
	"data-model": "dat",
	"user-story": "sto",
};

/**
 * Prefix to item type mapping (reverse of ITEM_TYPE_TO_PREFIX)
 */
export const PREFIX_TO_ITEM_TYPE: Record<string, ItemType> = {
	tsk: "task",
	crt: "criteria",
	tst: "test-case",
	flw: "flow",
	api: "api-contract",
	dat: "data-model",
	sto: "user-story",
};

/**
 * Regex patterns for ID validation
 */
export const ID_PATTERNS = {
	// Matches: pln-001, pln-123, brd-001, etc.
	entityIdSimple: /^([a-z]{3})-(\d{1,3})$/,
	// Matches: pln-001-my-slug, brd-123-feature-name, etc.
	entityIdWithSlug: /^([a-z]{3})-(\d{1,3})-([a-z0-9-]+)$/,
	// Matches: tsk-001, crt-123, tst-001, etc. (all 3 letters)
	itemId: /^([a-z]{3})-(\d{1,3})$/,
	// Matches: pln-draft-001, brd-draft-123, etc.
	draftId: /^([a-z]{3})-draft-(\d{1,3})$/,
};

/**
 * Parsed entity ID components
 */
export interface ParsedEntityId {
	prefix: string;
	number: number;
	slug?: string;
	entityType?: EntityType;
}

/**
 * Parsed item ID components
 */
export interface ParsedItemId {
	prefix: string;
	number: number;
	itemType?: ItemType;
}

/**
 * Parsed draft ID components
 */
export interface ParsedDraftId {
	prefix: string;
	number: number;
	entityType?: EntityType;
}

/**
 * Get the prefix for an entity type
 */
export function getEntityPrefix(type: EntityType): string {
	return ENTITY_TYPE_TO_PREFIX[type];
}

/**
 * Get the entity type for a prefix
 */
export function getEntityType(prefix: string): EntityType | undefined {
	return PREFIX_TO_ENTITY_TYPE[prefix];
}

/**
 * Get the prefix for an item type
 */
export function getItemPrefix(itemType: ItemType): string {
	return ITEM_TYPE_TO_PREFIX[itemType];
}

/**
 * Get the item type for a prefix
 */
export function getItemType(prefix: string): ItemType | undefined {
	return PREFIX_TO_ITEM_TYPE[prefix];
}

/**
 * Parse an entity ID
 * Accepts formats:
 * - typ-123
 * - typ-001 (with padding)
 * - typ-123-slug-here
 * - typ-001-slug-here (with padding)
 * - typ-123-slug-here.yml
 * - typ-123.yml
 */
export function parseEntityId(id: string): ParsedEntityId | null {
	// Remove .yml or .yaml extension if present
	const cleanId = id.replace(/\.(yml|yaml)$/, "");

	// Try matching with slug first
	let match = cleanId.match(ID_PATTERNS.entityIdWithSlug);
	if (match) {
		const [, prefix, numberStr, slug] = match;
		if (!prefix || !numberStr || !slug) return null;

		const entityType = getEntityType(prefix);
		if (!entityType) return null;

		return {
			prefix,
			number: Number.parseInt(numberStr, 10),
			slug,
			entityType,
		};
	}

	// Try matching without slug
	match = cleanId.match(ID_PATTERNS.entityIdSimple);
	if (match) {
		const [, prefix, numberStr] = match;
		if (!prefix || !numberStr) return null;

		const entityType = getEntityType(prefix);
		if (!entityType) return null;

		return {
			prefix,
			number: Number.parseInt(numberStr, 10),
			entityType,
		};
	}

	return null;
}

/**
 * Parse an item ID
 * Accepts formats:
 * - tsk-001
 * - crt-123
 * - tst-001
 */
export function parseItemId(id: string): ParsedItemId | null {
	const match = id.match(ID_PATTERNS.itemId);
	if (!match) return null;

	const [, prefix, numberStr] = match;
	if (!prefix || !numberStr) return null;

	// Check if this prefix is actually a known item type
	const itemType = getItemType(prefix);
	if (!itemType) return null;

	return {
		prefix,
		number: Number.parseInt(numberStr, 10),
		itemType,
	};
}

/**
 * Parse a draft ID
 * Accepts formats:
 * - pln-draft-001
 * - brd-draft-123
 */
export function parseDraftId(id: string): ParsedDraftId | null {
	const match = id.match(ID_PATTERNS.draftId);
	if (!match) return null;

	const [, prefix, numberStr] = match;
	if (!prefix || !numberStr) return null;

	const entityType = getEntityType(prefix);
	if (!entityType) return null;

	return {
		prefix,
		number: Number.parseInt(numberStr, 10),
		entityType,
	};
}

/**
 * Format an entity ID
 */
export function formatEntityId(params: {
	type: EntityType;
	number: number;
	slug?: string;
}): string {
	const prefix = getEntityPrefix(params.type);
	const paddedNumber = String(params.number).padStart(ID_NUMBER_PADDING, "0");

	if (params.slug) {
		return `${prefix}-${paddedNumber}-${params.slug}`;
	}
	return `${prefix}-${paddedNumber}`;
}

/**
 * Format an item ID
 */
export function formatItemId(params: {
	itemType: ItemType;
	number: number;
}): string {
	const prefix = getItemPrefix(params.itemType);
	const paddedNumber = String(params.number).padStart(ID_NUMBER_PADDING, "0");
	return `${prefix}-${paddedNumber}`;
}

/**
 * Format a draft ID
 */
export function formatDraftId(params: {
	type: EntityType;
	number: number;
}): string {
	const prefix = getEntityPrefix(params.type);
	const paddedNumber = String(params.number).padStart(ID_NUMBER_PADDING, "0");
	return `${prefix}-draft-${paddedNumber}`;
}

/**
 * Check if a string is a valid entity ID
 */
export function isValidEntityId(id: string): boolean {
	return parseEntityId(id) !== null;
}

/**
 * Check if a string is a valid item ID
 */
export function isValidItemId(id: string): boolean {
	return parseItemId(id) !== null;
}

/**
 * Check if a string is a valid draft ID
 */
export function isValidDraftId(id: string): boolean {
	return parseDraftId(id) !== null;
}

/**
 * Determine the type of ID
 */
export function getIdType(id: string): "entity" | "item" | "draft" | "unknown" {
	if (isValidDraftId(id)) return "draft";
	if (isValidEntityId(id)) return "entity";
	if (isValidItemId(id)) return "item";
	return "unknown";
}

/**
 * Extract number from any type of ID
 */
export function extractIdNumber(id: string): number | null {
	const entityParsed = parseEntityId(id);
	if (entityParsed) return entityParsed.number;

	const itemParsed = parseItemId(id);
	if (itemParsed) return itemParsed.number;

	const draftParsed = parseDraftId(id);
	if (draftParsed) return draftParsed.number;

	return null;
}

/**
 * Get all valid prefixes for entity types
 */
export function getAllEntityPrefixes(): string[] {
	return Object.keys(PREFIX_TO_ENTITY_TYPE);
}

/**
 * Get all valid prefixes for item types
 */
export function getAllItemPrefixes(): string[] {
	return Object.keys(PREFIX_TO_ITEM_TYPE);
}
