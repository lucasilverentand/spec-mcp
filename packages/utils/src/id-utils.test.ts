import { describe, expect, it } from "vitest";
import {
	ENTITY_TYPE_TO_PREFIX,
	extractIdNumber,
	formatDraftId,
	formatEntityId,
	formatItemId,
	getAllEntityPrefixes,
	getAllItemPrefixes,
	getEntityPrefix,
	getEntityType,
	getIdType,
	getItemPrefix,
	getItemType,
	ID_NUMBER_PADDING,
	ITEM_TYPE_TO_PREFIX,
	isValidDraftId,
	isValidEntityId,
	isValidItemId,
	PREFIX_TO_ENTITY_TYPE,
	PREFIX_TO_ITEM_TYPE,
	parseDraftId,
	parseEntityId,
	parseItemId,
} from "./id-utils";

describe("ID Utilities", () => {
	describe("Constants", () => {
		it("should have correct ID_NUMBER_PADDING", () => {
			expect(ID_NUMBER_PADDING).toBe(3);
		});

		it("should have bidirectional entity type mappings", () => {
			for (const [type, prefix] of Object.entries(ENTITY_TYPE_TO_PREFIX)) {
				expect(PREFIX_TO_ENTITY_TYPE[prefix]).toBe(type);
			}
		});

		it("should have bidirectional item type mappings", () => {
			for (const [type, prefix] of Object.entries(ITEM_TYPE_TO_PREFIX)) {
				expect(PREFIX_TO_ITEM_TYPE[prefix]).toBe(type);
			}
		});
	});

	describe("getEntityPrefix", () => {
		it("should return correct prefixes for entity types", () => {
			expect(getEntityPrefix("plan")).toBe("pln");
			expect(getEntityPrefix("business-requirement")).toBe("brd");
			expect(getEntityPrefix("technical-requirement")).toBe("prd");
			expect(getEntityPrefix("component")).toBe("cmp");
			expect(getEntityPrefix("constitution")).toBe("con");
			expect(getEntityPrefix("decision")).toBe("dec");
			expect(getEntityPrefix("milestone")).toBe("mls");
		});
	});

	describe("getEntityType", () => {
		it("should return correct entity types for prefixes", () => {
			expect(getEntityType("pln")).toBe("plan");
			expect(getEntityType("brd")).toBe("business-requirement");
			expect(getEntityType("prd")).toBe("technical-requirement");
		});

		it("should handle legacy aliases", () => {
			expect(getEntityType("brq")).toBe("business-requirement");
			expect(getEntityType("breq")).toBe("business-requirement");
			expect(getEntityType("trq")).toBe("technical-requirement");
			expect(getEntityType("treq")).toBe("technical-requirement");
		});

		it("should return undefined for unknown prefixes", () => {
			expect(getEntityType("xyz")).toBeUndefined();
		});
	});

	describe("getItemPrefix", () => {
		it("should return correct prefixes for item types", () => {
			expect(getItemPrefix("task")).toBe("tsk");
			expect(getItemPrefix("criteria")).toBe("crt");
			expect(getItemPrefix("test-case")).toBe("tst");
			expect(getItemPrefix("flow")).toBe("flw");
			expect(getItemPrefix("api-contract")).toBe("api");
			expect(getItemPrefix("data-model")).toBe("dat");
			expect(getItemPrefix("user-story")).toBe("sto");
		});
	});

	describe("getItemType", () => {
		it("should return correct item types for prefixes", () => {
			expect(getItemType("tsk")).toBe("task");
			expect(getItemType("crt")).toBe("criteria");
			expect(getItemType("tst")).toBe("test-case");
			expect(getItemType("flw")).toBe("flow");
			expect(getItemType("api")).toBe("api-contract");
			expect(getItemType("dat")).toBe("data-model");
			expect(getItemType("sto")).toBe("user-story");
		});

		it("should return undefined for unknown prefixes", () => {
			expect(getItemType("xyz")).toBeUndefined();
			expect(getItemType("task")).toBeUndefined();
			expect(getItemType("crit")).toBeUndefined();
			expect(getItemType("test")).toBeUndefined();
			expect(getItemType("flow")).toBeUndefined();
			expect(getItemType("data")).toBeUndefined();
			expect(getItemType("story")).toBeUndefined();
		});
	});

	describe("parseEntityId", () => {
		it("should parse simple entity IDs", () => {
			const result = parseEntityId("pln-001");
			expect(result).toEqual({
				prefix: "pln",
				number: 1,
				entityType: "plan",
			});
		});

		it("should parse entity IDs with slugs", () => {
			const result = parseEntityId("pln-001-my-feature");
			expect(result).toEqual({
				prefix: "pln",
				number: 1,
				slug: "my-feature",
				entityType: "plan",
			});
		});

		it("should parse entity IDs with .yml extension", () => {
			const result = parseEntityId("pln-001-my-feature.yml");
			expect(result).toEqual({
				prefix: "pln",
				number: 1,
				slug: "my-feature",
				entityType: "plan",
			});
		});

		it("should parse entity IDs without zero-padding", () => {
			const result = parseEntityId("pln-1");
			expect(result).toEqual({
				prefix: "pln",
				number: 1,
				entityType: "plan",
			});
		});

		it("should handle numbers without padding correctly", () => {
			const result = parseEntityId("brd-42-feature");
			expect(result).toEqual({
				prefix: "brd",
				number: 42,
				slug: "feature",
				entityType: "business-requirement",
			});
		});

		it("should return null for invalid IDs", () => {
			expect(parseEntityId("invalid")).toBeNull();
			expect(parseEntityId("pln-")).toBeNull();
			expect(parseEntityId("pln-abc")).toBeNull();
			expect(parseEntityId("toolongprefix-001")).toBeNull();
		});
	});

	describe("parseItemId", () => {
		it("should parse item IDs", () => {
			const result = parseItemId("tsk-001");
			expect(result).toEqual({
				prefix: "tsk",
				number: 1,
				itemType: "task",
			});
		});

		it("should parse criteria IDs", () => {
			const result = parseItemId("crt-042");
			expect(result).toEqual({
				prefix: "crt",
				number: 42,
				itemType: "criteria",
			});
		});

		it("should return null for invalid IDs", () => {
			expect(parseItemId("invalid")).toBeNull();
			expect(parseItemId("tsk-")).toBeNull();
			expect(parseItemId("tsk-abc")).toBeNull();
		});

		it("should return null for old 4-letter prefixes", () => {
			expect(parseItemId("task-001")).toBeNull();
			expect(parseItemId("crit-042")).toBeNull();
			expect(parseItemId("test-001")).toBeNull();
			expect(parseItemId("flow-001")).toBeNull();
			expect(parseItemId("data-001")).toBeNull();
		});
	});

	describe("parseDraftId", () => {
		it("should parse draft IDs", () => {
			const result = parseDraftId("pln-draft-001");
			expect(result).toEqual({
				prefix: "pln",
				number: 1,
				entityType: "plan",
			});
		});

		it("should parse draft IDs without zero-padding", () => {
			const result = parseDraftId("brd-draft-42");
			expect(result).toEqual({
				prefix: "brd",
				number: 42,
				entityType: "business-requirement",
			});
		});

		it("should return null for invalid draft IDs", () => {
			expect(parseDraftId("pln-001")).toBeNull();
			expect(parseDraftId("draft-001")).toBeNull();
			expect(parseDraftId("pln-draft-")).toBeNull();
		});
	});

	describe("formatEntityId", () => {
		it("should format entity ID without slug", () => {
			const id = formatEntityId({ type: "plan", number: 1 });
			expect(id).toBe("pln-001");
		});

		it("should format entity ID with slug", () => {
			const id = formatEntityId({
				type: "plan",
				number: 1,
				slug: "my-feature",
			});
			expect(id).toBe("pln-001-my-feature");
		});

		it("should pad numbers correctly", () => {
			expect(formatEntityId({ type: "plan", number: 1 })).toBe("pln-001");
			expect(formatEntityId({ type: "plan", number: 42 })).toBe("pln-042");
			expect(formatEntityId({ type: "plan", number: 999 })).toBe("pln-999");
		});
	});

	describe("formatItemId", () => {
		it("should format item IDs", () => {
			const id = formatItemId({ itemType: "task", number: 1 });
			expect(id).toBe("tsk-001");
		});

		it("should pad numbers correctly", () => {
			expect(formatItemId({ itemType: "task", number: 1 })).toBe("tsk-001");
			expect(formatItemId({ itemType: "task", number: 42 })).toBe("tsk-042");
			expect(formatItemId({ itemType: "criteria", number: 999 })).toBe(
				"crt-999",
			);
		});
	});

	describe("formatDraftId", () => {
		it("should format draft IDs", () => {
			const id = formatDraftId({ type: "plan", number: 1 });
			expect(id).toBe("pln-draft-001");
		});

		it("should pad numbers correctly", () => {
			expect(formatDraftId({ type: "plan", number: 1 })).toBe("pln-draft-001");
			expect(formatDraftId({ type: "plan", number: 42 })).toBe("pln-draft-042");
		});
	});

	describe("isValidEntityId", () => {
		it("should validate entity IDs", () => {
			expect(isValidEntityId("pln-001")).toBe(true);
			expect(isValidEntityId("pln-001-my-feature")).toBe(true);
			expect(isValidEntityId("pln-001.yml")).toBe(true);
			expect(isValidEntityId("invalid")).toBe(false);
			expect(isValidEntityId("task-001")).toBe(false);
		});
	});

	describe("isValidItemId", () => {
		it("should validate item IDs", () => {
			expect(isValidItemId("tsk-001")).toBe(true);
			expect(isValidItemId("crt-042")).toBe(true);
			expect(isValidItemId("invalid")).toBe(false);
			expect(isValidItemId("pln-001")).toBe(false);
			expect(isValidItemId("task-001")).toBe(false);
			expect(isValidItemId("crit-042")).toBe(false);
		});
	});

	describe("isValidDraftId", () => {
		it("should validate draft IDs", () => {
			expect(isValidDraftId("pln-draft-001")).toBe(true);
			expect(isValidDraftId("brd-draft-042")).toBe(true);
			expect(isValidDraftId("invalid")).toBe(false);
			expect(isValidDraftId("pln-001")).toBe(false);
		});
	});

	describe("getIdType", () => {
		it("should identify entity IDs", () => {
			expect(getIdType("pln-001")).toBe("entity");
			expect(getIdType("pln-001-feature")).toBe("entity");
		});

		it("should identify item IDs", () => {
			expect(getIdType("tsk-001")).toBe("item");
			expect(getIdType("crt-042")).toBe("item");
		});

		it("should identify draft IDs", () => {
			expect(getIdType("pln-draft-001")).toBe("draft");
		});

		it("should return unknown for invalid IDs", () => {
			expect(getIdType("invalid")).toBe("unknown");
			expect(getIdType("task-001")).toBe("unknown");
			expect(getIdType("crit-042")).toBe("unknown");
		});
	});

	describe("extractIdNumber", () => {
		it("should extract number from entity IDs", () => {
			expect(extractIdNumber("pln-001")).toBe(1);
			expect(extractIdNumber("pln-042-feature")).toBe(42);
		});

		it("should extract number from item IDs", () => {
			expect(extractIdNumber("tsk-001")).toBe(1);
			expect(extractIdNumber("crt-042")).toBe(42);
		});

		it("should extract number from draft IDs", () => {
			expect(extractIdNumber("pln-draft-001")).toBe(1);
			expect(extractIdNumber("brd-draft-042")).toBe(42);
		});

		it("should return null for invalid IDs", () => {
			expect(extractIdNumber("invalid")).toBeNull();
			expect(extractIdNumber("task-001")).toBeNull();
		});
	});

	describe("getAllEntityPrefixes", () => {
		it("should return all entity prefixes", () => {
			const prefixes = getAllEntityPrefixes();
			expect(prefixes).toContain("pln");
			expect(prefixes).toContain("brd");
			expect(prefixes).toContain("prd");
			expect(prefixes.length).toBeGreaterThan(0);
		});
	});

	describe("getAllItemPrefixes", () => {
		it("should return all item prefixes", () => {
			const prefixes = getAllItemPrefixes();
			expect(prefixes).toContain("tsk");
			expect(prefixes).toContain("crt");
			expect(prefixes).toContain("tst");
			expect(prefixes).toContain("flw");
			expect(prefixes).toContain("api");
			expect(prefixes).toContain("dat");
			expect(prefixes).toContain("sto");
			expect(prefixes.length).toBe(7);
		});
	});

	describe("Round-trip conversions", () => {
		it("should parse and format entity IDs correctly", () => {
			const original = "pln-001-my-feature";
			const parsed = parseEntityId(original);
			expect(parsed).not.toBeNull();
			if (parsed?.entityType && parsed.slug) {
				const formatted = formatEntityId({
					type: parsed.entityType,
					number: parsed.number,
					slug: parsed.slug,
				});
				expect(formatted).toBe(original);
			}
		});

		it("should parse and format item IDs correctly", () => {
			const original = "tsk-042";
			const parsed = parseItemId(original);
			expect(parsed).not.toBeNull();
			if (parsed) {
				const formatted = formatItemId({
					itemType: parsed.itemType!,
					number: parsed.number,
				});
				expect(formatted).toBe(original);
			}
		});

		it("should parse and format draft IDs correctly", () => {
			const original = "pln-draft-007";
			const parsed = parseDraftId(original);
			expect(parsed).not.toBeNull();
			if (parsed) {
				const formatted = formatDraftId({
					type: parsed.entityType!,
					number: parsed.number,
				});
				expect(formatted).toBe(original);
			}
		});
	});
});
