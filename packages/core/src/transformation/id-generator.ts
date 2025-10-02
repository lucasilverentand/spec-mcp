import type { EntityType } from "@spec-mcp/data";
import type { OperationResult } from "../interfaces/results.js";
import type { IIdGenerator } from "../interfaces/transformer.js";
import { calculateStringSimilarity } from "../utils/string-utils.js";
import {
	generateSlugFromTitle,
	generateUniqueSlug,
	sanitizeSlug,
	validateSlug,
} from "./slug-generator.js";

const prefixMap: Record<EntityType, string> = {
	requirement: "req",
	plan: "pln",
	app: "app",
	service: "svc",
	library: "lib",
	constitution: "con",
};

const typeMap: Record<string, EntityType> = {
	req: "requirement",
	pln: "plan",
	app: "app",
	svc: "service",
	lib: "library",
	con: "constitution",
};

export class IdGenerator implements IIdGenerator {
	readonly name = "IdGenerator";
	readonly version = "2.0.0";

	async transform(input: string): Promise<OperationResult<string>> {
		// Basic ID generation from string input
		const id = this.generateId(input);
		return {
			success: true,
			data: id,
			timestamp: new Date(),
		};
	}

	canTransform(input: unknown): input is string {
		return typeof input === "string";
	}

	supports(inputType: string, outputType: string): boolean {
		return inputType === "string" && outputType === "string";
	}

	generateId(prefix?: string): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 8);
		const prefixStr = prefix ? `${prefix}-` : "";
		return `${prefixStr}${timestamp}-${random}`;
	}

	generateUniqueId(existingIds: string[], prefix?: string): string {
		let id: string;
		do {
			id = this.generateId(prefix);
		} while (existingIds.includes(id));
		return id;
	}

	validateId(id: string): boolean {
		// Basic ID validation - must be non-empty string with reasonable length
		return typeof id === "string" && id.length > 0 && id.length <= 100;
	}
}

// Enhanced entity-specific ID functions
export function generateId(
	entityType: EntityType,
	number: number,
	slug: string,
): string {
	const prefix = getPrefix(entityType);
	const paddedNumber = number.toString().padStart(3, "0");
	const sanitizedSlug = sanitizeSlug(slug);

	return `${prefix}-${paddedNumber}-${sanitizedSlug}`;
}

export function generateUniqueId(
	entityType: EntityType,
	number: number,
	title: string,
	existingIds: string[],
): string {
	const baseSlug = generateSlugFromTitle(title);
	const uniqueSlug = generateUniqueSlug(
		baseSlug,
		existingIds
			.map((id) => extractSlug(id))
			.filter((s): s is string => Boolean(s)),
	);

	return generateId(entityType, number, uniqueSlug);
}

export function parseId(id: string): {
	entityType: EntityType;
	number: number;
	slug: string;
} | null {
	const match = id.match(/^(req|pln|app|svc|lib|con)-(\d{3})-(.+)$/);
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

export function validateId(id: string, expectedType?: EntityType): boolean {
	const parsed = parseId(id);
	if (!parsed) {
		return false;
	}

	if (expectedType && parsed.entityType !== expectedType) {
		return false;
	}

	// Validate slug format
	return validateSlug(parsed.slug);
}

export function extractSlug(id: string): string | null {
	const parsed = parseId(id);
	return parsed?.slug || null;
}

export function extractNumber(id: string): number | null {
	const parsed = parseId(id);
	return parsed?.number || null;
}

export function extractEntityType(id: string): EntityType | null {
	const parsed = parseId(id);
	return parsed?.entityType || null;
}

export function getNextNumber(
	existingIds: string[],
	entityType: EntityType,
): number {
	const numbers = existingIds
		.map((id) => parseId(id))
		.filter((parsed) => parsed && parsed.entityType === entityType)
		.map((parsed) => parsed?.number)
		.filter((num): num is number => num !== undefined);

	return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

export function generateChildId(
	parentId: string,
	childType: string,
	childNumber: number,
): string {
	const parsed = parseId(parentId);
	if (!parsed) {
		throw new Error(`Invalid parent ID format: ${parentId}`);
	}

	const childId = `${childType}-${childNumber.toString().padStart(3, "0")}`;
	return `${parentId}/${childId}`;
}

export function generateCriteriaId(
	requirementId: string,
	criteriaNumber: number,
): string {
	return generateChildId(requirementId, "crit", criteriaNumber);
}

export function generateTaskId(planId: string, taskNumber: number): string {
	return generateChildId(planId, "task", taskNumber);
}

export function generateFlowId(planId: string, flowNumber: number): string {
	return generateChildId(planId, "flow", flowNumber);
}

export function generateStepId(flowId: string, stepNumber: number): string {
	return generateChildId(flowId, "step", stepNumber);
}

export function generateTestCaseId(planId: string, testNumber: number): string {
	return generateChildId(planId, "test", testNumber);
}

export function getPrefix(entityType: EntityType): string {
	return prefixMap[entityType];
}

export function getEntityTypeFromPrefix(
	prefix: string,
): EntityType | undefined {
	return typeMap[prefix];
}

export function suggestSimilarIds(
	input: string,
	existingIds: string[],
): string[] {
	const parsed = parseId(input);
	if (!parsed) {
		return [];
	}

	// Find IDs with similar slugs
	const similarIds = existingIds
		.filter((id) => {
			const existing = parseId(id);
			return (
				existing &&
				existing.entityType === parsed.entityType &&
				calculateStringSimilarity(existing.slug, parsed.slug) > 0.6
			);
		})
		.sort((a, b) => {
			const aSlug = extractSlug(a);
			const bSlug = extractSlug(b);
			if (!aSlug || !bSlug) return 0;
			return (
				calculateStringSimilarity(bSlug, parsed.slug) -
				calculateStringSimilarity(aSlug, parsed.slug)
			);
		});

	return similarIds.slice(0, 5);
}

// Legacy class-based API for backward compatibility
export { IdGenerator as IdGeneratorClass };

// Static methods for backward compatibility
Object.assign(IdGenerator, {
	generateId,
	generateUniqueId,
	parseId,
	validateId,
	extractSlug,
	extractNumber,
	extractEntityType,
	getNextNumber,
	generateChildId,
	generateCriteriaId,
	generateTaskId,
	generateFlowId,
	generateStepId,
	generateTestCaseId,
	getPrefix,
	getEntityTypeFromPrefix,
	suggestSimilarIds,
});
