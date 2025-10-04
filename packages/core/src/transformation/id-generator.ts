import type { EntityType } from "@spec-mcp/data";
import {
	extractEntityType as dataExtractEntityType,
	extractNumber as dataExtractNumber,
	extractSlug as dataExtractSlug,
	generateChildId as dataGenerateChildId,
	generateCriteriaId as dataGenerateCriteriaId,
	generateFlowId as dataGenerateFlowId,
	generateId as dataGenerateId,
	generateStepId as dataGenerateStepId,
	generateTaskId as dataGenerateTaskId,
	generateTestCaseId as dataGenerateTestCaseId,
	getEntityTypeFromPrefix as dataGetEntityTypeFromPrefix,
	getPrefix as dataGetPrefix,
	parseId as dataParseId,
	validateId as dataValidateId,
} from "@spec-mcp/data";
import type { OperationResult } from "../interfaces/results.js";
import type { IIdGenerator } from "../interfaces/transformer.js";
import { calculateStringSimilarity } from "../utils/string-utils.js";
import { generateSlugFromTitle, generateUniqueSlug } from "./slug-generator.js";

// Re-export from data package for backward compatibility
export {
	extractEntityType,
	extractNumber,
	extractSlug,
	generateApiId,
	generateChildId,
	generateCriteriaId,
	generateDataModelId,
	generateFlowId,
	generateId,
	generateStepId,
	generateTaskId,
	generateTestCaseId,
	getEntityTypeFromPrefix,
	getPrefix,
	parseId,
	validateId,
} from "@spec-mcp/data";

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

// Generate unique ID with title-based slug generation
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
			.map((id) => dataExtractSlug(id))
			.filter((s): s is string => Boolean(s)),
	);

	return dataGenerateId(entityType, number, uniqueSlug);
}

export function getNextNumber(
	existingIds: string[],
	entityType: EntityType,
): number {
	const numbers = existingIds
		.map((id) => dataParseId(id))
		.filter((parsed) => parsed && parsed.entityType === entityType)
		.map((parsed) => parsed?.number)
		.filter((num): num is number => num !== undefined);

	return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

export function suggestSimilarIds(
	input: string,
	existingIds: string[],
): string[] {
	const parsed = dataParseId(input);
	if (!parsed) {
		return [];
	}

	// Find IDs with similar slugs
	const similarIds = existingIds
		.filter((id) => {
			const existing = dataParseId(id);
			return (
				existing &&
				existing.entityType === parsed.entityType &&
				calculateStringSimilarity(existing.slug, parsed.slug) > 0.6
			);
		})
		.sort((a, b) => {
			const aSlug = dataExtractSlug(a);
			const bSlug = dataExtractSlug(b);
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
	generateId: dataGenerateId,
	generateUniqueId,
	parseId: dataParseId,
	validateId: dataValidateId,
	extractSlug: dataExtractSlug,
	extractNumber: dataExtractNumber,
	extractEntityType: dataExtractEntityType,
	getNextNumber,
	generateChildId: dataGenerateChildId,
	generateCriteriaId: dataGenerateCriteriaId,
	generateTaskId: dataGenerateTaskId,
	generateFlowId: dataGenerateFlowId,
	generateStepId: dataGenerateStepId,
	generateTestCaseId: dataGenerateTestCaseId,
	getEntityTypeFromPrefix: dataGetEntityTypeFromPrefix,
	getPrefix: dataGetPrefix,
	suggestSimilarIds,
});
