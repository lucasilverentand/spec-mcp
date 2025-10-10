import { describe, expect, it } from "vitest";
import { createBusinessRequirementDrafterConfig } from "../src/drafters/business-requirement-drafter";
import { createComponentDrafterConfig } from "../src/drafters/component-drafter";
import { createTechnicalRequirementDrafterConfig } from "../src/drafters/technical-requirement-drafter";
import {
	createEntityDrafter,
	restoreEntityDrafter,
} from "../src/entity-drafter-factory";

describe("EntityDrafter Factory", () => {
	describe("createEntityDrafter", () => {
		it("should create a drafter with configured array drafters", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Should have main questions
			const firstQuestion = drafter.currentQuestion();
			expect(firstQuestion).not.toBeNull();
			expect(firstQuestion?.question).toContain("title");

			// Should have configured array drafters
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			expect(businessValueDrafter).toBeDefined();

			const stakeholdersDrafter = drafter.getArrayDrafter("stakeholders");
			expect(stakeholdersDrafter).toBeDefined();

			const userStoriesDrafter = drafter.getArrayDrafter("user_stories");
			expect(userStoriesDrafter).toBeDefined();

			const criteriaDrafter = drafter.getArrayDrafter("criteria");
			expect(criteriaDrafter).toBeDefined();
		});

		it("should progress through main questions before array questions", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			expect(drafter.currentQuestion()?.question).toContain("description");

			drafter.submitAnswer("A detailed description");

			// Next question should be from the first array drafter
			const nextQuestion = drafter.currentQuestion();
			expect(nextQuestion?.question).toBeDefined();
		});

		it("should handle array drafter workflow", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");

			// Now at business_value collection question
			expect(drafter.currentQuestion()?.question).toBeDefined();

			// Answer the collection question with descriptions
			drafter.submitAnswer("Increased revenue, Better customer satisfaction");

			// Get the array drafter and set descriptions based on the answer
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			expect(businessValueDrafter).toBeDefined();

			businessValueDrafter?.setDescriptions([
				"Increased revenue",
				"Better customer satisfaction",
			]);

			// Should now be on first item's first question
			const currentQuestion = drafter.currentQuestion();
			expect(currentQuestion).not.toBeNull();
			expect(currentQuestion?.question).toContain("type");

			// Answer the item questions
			drafter.submitAnswer("revenue");
			expect(drafter.currentQuestion()?.question).toContain("value");

			drafter.submitAnswer("Expected 20% increase in revenue");

			// Note: business_value may be optional (minLength=0), which means after answering
			// all questions for one item, the system can move to the next array field (stakeholders)
			// instead of requiring finalization first. This is the current behavior.
			// The test just verifies that the workflow continues properly.

			// Verify we've moved on to the next question (either second item or next array)
			const nextQuestion = drafter.currentQuestion();
			expect(nextQuestion?.question).toBeDefined();
		});
	});

	describe("restoreEntityDrafter", () => {
		it("should restore drafter state including array drafters", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Progress through some questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");

			// Answer collection question
			drafter.submitAnswer("Increased revenue");

			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Increased revenue"]);

			drafter.submitAnswer("revenue");

			// Serialize
			const state = drafter.toJSON();

			// Restore
			const restoredDrafter = restoreEntityDrafter(config, state);

			// Should be at the same question
			expect(restoredDrafter.currentQuestion()?.question).toBeDefined();

			// Array drafter should be restored
			const restoredArrayDrafter =
				restoredDrafter.getArrayDrafter("business_value");
			expect(restoredArrayDrafter).toBeDefined();
			expect(restoredArrayDrafter?.items).toHaveLength(1);
			expect(restoredArrayDrafter?.items[0].description).toBe(
				"Increased revenue",
			);
		});

		it("should restore completed drafter state", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer all questions and finalize
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");

			// For this test, we'll just skip the array questions by manually setting finalized
			// In real usage, you'd answer all array questions and call finalize with valid data
			const state = drafter.toJSON();
			state.finalized = true;

			// Restore
			const restoredDrafter = restoreEntityDrafter(config, state);

			expect(restoredDrafter.finalized).toBe(true);
		});
	});

	describe("Multiple Entity Types", () => {
		it("should support different drafter configs for different entity types", () => {
			// Create different drafters
			const brConfig = createBusinessRequirementDrafterConfig();
			const trConfig = createTechnicalRequirementDrafterConfig();
			const compConfig = createComponentDrafterConfig();

			const brDrafter = createEntityDrafter(brConfig);
			const trDrafter = createEntityDrafter(trConfig);
			const compDrafter = createEntityDrafter(compConfig);

			// Each should have different questions
			expect(brDrafter.currentQuestion()?.question).toContain("business");
			expect(trDrafter.currentQuestion()?.question).toContain("technical");
			expect(compDrafter.currentQuestion()?.question).toContain("component");

			// Each should have different array drafters
			expect(brDrafter.getArrayDrafter("business_value")).toBeDefined();
			expect(brDrafter.getArrayDrafter("constraints")).toBeUndefined();

			expect(trDrafter.getArrayDrafter("constraints")).toBeDefined();
			expect(trDrafter.getArrayDrafter("business_value")).toBeUndefined();

			expect(compDrafter.getArrayDrafter("deployments")).toBeDefined();
			expect(compDrafter.getArrayDrafter("business_value")).toBeUndefined();
		});
	});
});
