import { describe, expect, it } from "vitest";
import { createBusinessRequirementDrafterConfig } from "../src/drafters/business-requirement-drafter";
import { createEntityDrafter } from "../src/entity-drafter-factory";

describe("Schema Optimization", () => {
	it("should omit prefilled array fields from schema in getEntityContext", () => {
		const config = createBusinessRequirementDrafterConfig();
		const drafter = createEntityDrafter(config);

		// Answer main questions
		drafter.submitAnswer("Test Requirement");
		drafter.submitAnswer("A detailed description");
		drafter.submitAnswer(""); // q-003: constraints (optional)
		drafter.submitAnswer(""); // q-004: technical requirements (optional)
		drafter.submitAnswer(""); // q-005: components (optional)
		drafter.submitAnswer(""); // q-006: research (optional)

		// Answer business_value collection question
		drafter.submitAnswer("Value 1, Value 2");

		// Get the array drafter and set descriptions
		const businessValueDrafter = drafter.getArrayDrafter("business_value");
		expect(businessValueDrafter).toBeDefined();
		businessValueDrafter?.setDescriptions(["Value 1", "Value 2"]);

		// Answer questions for first item
		drafter.submitAnswer("revenue");
		drafter.submitAnswer("Increase revenue by 20%");

		// Finalize first item
		drafter.finalizeByEntityId("business_value[0]", {
			type: "revenue",
			value: "Increase revenue by 20%",
		});

		// Answer questions for second item
		drafter.submitAnswer("cost-savings");
		drafter.submitAnswer("Reduce processing time by 50%");

		// Finalize second item
		drafter.finalizeByEntityId("business_value[1]", {
			type: "cost-savings",
			value: "Reduce processing time by 50%",
		});

		// Skip remaining array fields by marking their collection questions as skipped
		for (let i = 0; i < 10; i++) {
			const q = drafter.currentQuestion();
			if (q && !q.answer) {
				q.skipped = true;
			}
		}

		// Now get entity context - business_value should be prefilled
		const context = drafter.getEntityContext();

		// Verify prefilled data exists
		expect(context.prefilledData).toBeDefined();
		expect(context.prefilledData.business_value).toBeDefined();
		expect(context.prefilledData.business_value).toHaveLength(2);

		// Verify schema does NOT have business_value in properties
		const schema = context.schema as {
			$ref?: string;
			definitions?: Record<
				string,
				{
					properties?: Record<string, unknown>;
					required?: string[];
				}
			>;
		};

		// The schema uses $ref and definitions structure
		expect(schema.definitions?.EntitySchema).toBeDefined();
		const entitySchema = schema.definitions?.EntitySchema;
		expect(entitySchema?.properties).toBeDefined();
		expect(entitySchema?.properties?.business_value).toBeUndefined();

		// Verify the schema still has other properties
		expect(entitySchema?.properties?.name).toBeDefined();
		expect(entitySchema?.properties?.description).toBeDefined();

		// Verify instructions mention the prefilled arrays
		expect(context.nextStep.instruction).toContain("business_value");
		expect(context.nextStep.instruction).toContain("array fields omitted");
	});

	it("should include all properties when no arrays are prefilled", () => {
		const config = createBusinessRequirementDrafterConfig();
		const drafter = createEntityDrafter(config);

		// Answer main questions
		drafter.submitAnswer("Test Requirement");
		drafter.submitAnswer("A detailed description");
		drafter.submitAnswer(""); // q-003: constraints (optional)
		drafter.submitAnswer(""); // q-004: technical requirements (optional)
		drafter.submitAnswer(""); // q-005: components (optional)
		drafter.submitAnswer(""); // q-006: research (optional)

		// Skip all array questions
		for (let i = 0; i < 20; i++) {
			const q = drafter.currentQuestion();
			if (q && !q.answer) {
				q.skipped = true;
			}
		}

		// Get entity context - no arrays should be prefilled
		const context = drafter.getEntityContext();

		// Verify no prefilled data (or empty object)
		expect(
			!context.prefilledData || Object.keys(context.prefilledData).length === 0,
		).toBe(true);

		// Verify schema still has all properties including arrays
		const schema = context.schema as {
			$ref?: string;
			definitions?: Record<
				string,
				{
					properties?: Record<string, unknown>;
					required?: string[];
				}
			>;
		};

		// The schema uses $ref and definitions structure
		expect(schema.definitions?.EntitySchema).toBeDefined();
		const entitySchema = schema.definitions?.EntitySchema;
		expect(entitySchema?.properties).toBeDefined();
		expect(entitySchema?.properties?.name).toBeDefined();
		expect(entitySchema?.properties?.description).toBeDefined();
		expect(entitySchema?.properties?.business_value).toBeDefined();
		expect(entitySchema?.properties?.stakeholders).toBeDefined();
	});
});
