import type { EntityType } from "../core/base-entity.js";
import { shortenEntityType } from "../core/base-entity.js";

const typeMap: Record<string, EntityType> = {
	req: "requirement",
	pln: "plan",
	app: "app",
	svc: "service",
	lib: "library",
	con: "constitution",
	dec: "decision",
};

/**
 * Generate entity ID from type, number, and slug
 */
export function generateId(
	entityType: EntityType,
	number: number,
	slug: string,
): string {
	const prefix = shortenEntityType(entityType);
	const paddedNumber = number.toString().padStart(3, "0");

	return `${prefix}-${paddedNumber}-${slug}`;
}

/**
 * Parse entity ID into its components
 */
export function parseId(id: string): {
	entityType: EntityType;
	number: number;
	slug: string;
} | null {
	const match = id.match(/^(req|pln|app|svc|lib|con|dec)-(\d{3})-(.+)$/);
	if (!match) {
		return null;
	}

	const [, prefix, numberStr, slug] = match;
	if (!prefix || !numberStr || !slug) {
		return null;
	}

	const entityType = getEntityTypeFromPrefix(prefix);
	const number = Number.parseInt(numberStr, 10);

	if (!entityType) {
		return null;
	}

	return { entityType, number, slug };
}

/**
 * Validate entity ID format
 */
export function validateId(id: string, expectedType?: EntityType): boolean {
	const parsed = parseId(id);
	if (!parsed) {
		return false;
	}

	if (expectedType && parsed.entityType !== expectedType) {
		return false;
	}

	return true;
}

/**
 * Extract slug from entity ID
 */
export function extractSlug(id: string): string | null {
	const parsed = parseId(id);
	return parsed?.slug || null;
}

/**
 * Extract number from entity ID
 */
export function extractNumber(id: string): number | null {
	const parsed = parseId(id);
	return parsed?.number || null;
}

/**
 * Extract entity type from entity ID
 */
export function extractEntityType(id: string): EntityType | null {
	const parsed = parseId(id);
	return parsed?.entityType || null;
}

/**
 * Get entity type from prefix
 */
export function getEntityTypeFromPrefix(
	prefix: string,
): EntityType | undefined {
	return typeMap[prefix];
}

/**
 * Get prefix for entity type
 */
export function getPrefix(entityType: EntityType): string {
	return shortenEntityType(entityType);
}

/**
 * Generate child entity ID (for sub-entities like tasks, criteria, etc.)
 */
export function generateChildId(
	parentId: string,
	childType: string,
	childNumber: number,
): string {
	// Validate parent ID format only if it's a full entity ID (not a sub-entity ID)
	// Sub-entity IDs like "flow-001" are valid parents for nested items like steps
	if (parentId.includes("-") && !parentId.match(/^(flow|task|tc|api|dm|step|crit)-\d{3}$/)) {
		const parsed = parseId(parentId);
		if (!parsed) {
			throw new Error(`Invalid parent ID format: ${parentId}`);
		}
	}

	// Return simple child ID without parent prefix
	const childId = `${childType}-${childNumber.toString().padStart(3, "0")}`;
	return childId;
}

/**
 * Generate criteria ID for requirement criteria
 */
export function generateCriteriaId(
	requirementId: string,
	criteriaNumber: number,
): string {
	return generateChildId(requirementId, "crit", criteriaNumber);
}

/**
 * Generate task ID for plan tasks
 */
export function generateTaskId(planId: string, taskNumber: number): string {
	return generateChildId(planId, "task", taskNumber);
}

/**
 * Generate flow ID for plan flows
 */
export function generateFlowId(planId: string, flowNumber: number): string {
	return generateChildId(planId, "flow", flowNumber);
}

/**
 * Generate step ID for flow steps
 */
export function generateStepId(flowId: string, stepNumber: number): string {
	return generateChildId(flowId, "step", stepNumber);
}

/**
 * Generate test case ID for plan test cases
 */
export function generateTestCaseId(planId: string, testNumber: number): string {
	return generateChildId(planId, "test", testNumber);
}

/**
 * Generate API contract ID
 */
export function generateApiId(planId: string, apiNumber: number): string {
	return generateChildId(planId, "api", apiNumber);
}

/**
 * Generate data model ID
 */
export function generateDataModelId(planId: string, dmNumber: number): string {
	return generateChildId(planId, "dm", dmNumber);
}
