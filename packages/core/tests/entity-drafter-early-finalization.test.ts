import { describe, expect, it } from "vitest";
import { createBusinessRequirementDrafterConfig } from "../src/drafters/business-requirement-drafter";
import { createEntityDrafter } from "../src/entity-drafter-factory";

describe("Entity Drafter LLM-Driven Finalization", () => {
	describe("Get context for LLM to generate data", () => {
		it("should provide question/answer context for an array item", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Answer collection question and set descriptions
			drafter.submitAnswer("Increased revenue");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Increased revenue"]);

			// Verify we're at the first item's questions
			const currentQ = drafter.currentQuestion();
			expect(currentQ).not.toBeNull();

			// Answer all questions for first item
			drafter.submitAnswer("revenue");
			drafter.submitAnswer("Expected 20% increase in revenue");

			// Get context for LLM to generate final data
			const context = businessValueDrafter?.getItemContext(0);
			expect(context).not.toBeNull();
			expect(context?.description).toBe("Increased revenue");

			// Verify the item's drafter has questions completed
			const item = businessValueDrafter?.getItem(0);
			expect(item?.drafter.questionsComplete).toBe(true);

			// LLM would use this context to generate schema-compliant data
			const llmGeneratedData = {
				type: "revenue" as const,
				value: "Expected 20% increase in revenue",
			};

			// Finalize with LLM-generated data
			businessValueDrafter?.finalizeItemWithData(0, llmGeneratedData);

			// Verify the item is now finalized
			const finalizedItem = businessValueDrafter?.getItem(0);
			expect(finalizedItem?.drafter.isComplete).toBe(true);
			expect(finalizedItem?.drafter.data).toEqual(llmGeneratedData);
		});

		it("should skip finalized items when returning currentQuestion", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Set up two business values
			drafter.submitAnswer("Increased revenue, Better UX");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Increased revenue", "Better UX"]);

			// Answer and finalize first item
			drafter.submitAnswer("revenue");
			drafter.submitAnswer("Expected 20% increase");
			businessValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "Expected 20% increase",
			});

			// Current question should now be from second item, not first
			const currentQ = drafter.currentQuestion();
			expect(currentQ).not.toBeNull();

			// Answer second item's questions
			drafter.submitAnswer("user-experience");
			expect(drafter.currentQuestion()).not.toBeNull();
		});

		it("should return all finalized data from array drafter", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Set up three business values
			drafter.submitAnswer("Revenue, UX, Security");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Revenue", "UX", "Security"]);

			// Finalize first two items
			drafter.submitAnswer("revenue");
			drafter.submitAnswer("20% increase");
			businessValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "20% increase",
			});

			drafter.submitAnswer("customer-satisfaction");
			drafter.submitAnswer("Improved NPS");
			businessValueDrafter?.finalizeItemWithData(1, {
				type: "customer-satisfaction",
				value: "Improved NPS",
			});

			// Get finalized data (should only include first two)
			const finalizedData = businessValueDrafter?.getFinalizedData();
			expect(finalizedData).toHaveLength(2);
			expect(finalizedData?.[0]).toEqual({
				type: "revenue",
				value: "20% increase",
			});
			expect(finalizedData?.[1]).toEqual({
				type: "customer-satisfaction",
				value: "Improved NPS",
			});
		});

		it("should identify incomplete item indices", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			drafter.submitAnswer("Item 1, Item 2, Item 3");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Item 1", "Item 2", "Item 3"]);

			// Initially all items are incomplete
			expect(businessValueDrafter?.incompletItemIndices).toEqual([0, 1, 2]);

			// Finalize first item
			drafter.submitAnswer("revenue");
			drafter.submitAnswer("Value 1");
			businessValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "Value 1",
			});

			// Now only items 1 and 2 are incomplete
			expect(businessValueDrafter?.incompletItemIndices).toEqual([1, 2]);

			// Finalize second item
			drafter.submitAnswer("cost-savings");
			drafter.submitAnswer("Value 2");
			businessValueDrafter?.finalizeItemWithData(1, {
				type: "cost-savings",
				value: "Value 2",
			});

			// Now only item 2 is incomplete
			expect(businessValueDrafter?.incompletItemIndices).toEqual([2]);
		});
	});

	describe("Prefill parent entity with finalized array data", () => {
		it("should return prefilled array data from parent drafter", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Answer main questions
			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Set up and finalize business values
			drafter.submitAnswer("Revenue");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Revenue"]);

			drafter.submitAnswer("revenue");
			drafter.submitAnswer("20% increase");
			businessValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "20% increase",
			});

			// Set up and finalize stakeholders
			drafter.submitAnswer("Product Owner");
			const stakeholdersDrafter = drafter.getArrayDrafter("stakeholders");
			stakeholdersDrafter?.setDescriptions(["Product Owner"]);

			drafter.submitAnswer(
				"Product Owner, Sarah Chen, Needs feature delivered on time, sarah@example.com",
			);
			stakeholdersDrafter?.finalizeItemWithData(0, {
				role: "product-owner",
				name: "Jane Doe",
				interest: "Wants feature completed",
				email: "jane@example.com",
			});

			// Get prefilled data
			const prefilledData = drafter.getPrefilledArrayData();

			expect(prefilledData).toHaveProperty("business_value");
			expect(prefilledData).toHaveProperty("stakeholders");
			expect(prefilledData.business_value).toHaveLength(1);
			expect(prefilledData.stakeholders).toHaveLength(1);
			expect(prefilledData.business_value?.[0]).toEqual({
				type: "revenue",
				value: "20% increase",
			});
			expect(prefilledData.stakeholders?.[0]).toEqual({
				role: "product-owner",
				name: "Jane Doe",
				interest: "Wants feature completed",
				email: "jane@example.com",
			});
		});

		it("should only include arrays with finalized items in prefill", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			drafter.submitAnswer("Test Requirement");
			drafter.submitAnswer("A detailed description");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Finalize business_value
			drafter.submitAnswer("Revenue");
			const businessValueDrafter = drafter.getArrayDrafter("business_value");
			businessValueDrafter?.setDescriptions(["Revenue"]);
			drafter.submitAnswer("revenue");
			drafter.submitAnswer("Value");
			businessValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "Value",
			});

			// Don't finalize stakeholders - just answer collection question
			drafter.submitAnswer("PM");

			// Prefill should only include business_value, not stakeholders
			const prefilledData = drafter.getPrefilledArrayData();
			expect(prefilledData).toHaveProperty("business_value");
			expect(prefilledData).not.toHaveProperty("stakeholders");
		});
	});

	describe("Integration: Full workflow with early finalization", () => {
		it("should allow LLM to finalize items incrementally and use prefilled data at the end", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			// Main questions
			drafter.submitAnswer("User Authentication");
			drafter.submitAnswer("Secure login system");
			drafter.submitAnswer(""); // q-003: constraints (optional)
			drafter.submitAnswer(""); // q-004: technical requirements (optional)
			drafter.submitAnswer(""); // q-005: components (optional)
			drafter.submitAnswer(""); // q-006: research (optional)

			// Business values - finalize as we go
			drafter.submitAnswer("Security, UX");
			const bizValueDrafter = drafter.getArrayDrafter("business_value");
			bizValueDrafter?.setDescriptions(["Security", "UX"]);

			drafter.submitAnswer("revenue");
			drafter.submitAnswer("Reduced breach risk");
			bizValueDrafter?.finalizeItemWithData(0, {
				type: "revenue",
				value: "Reduced breach risk",
			});

			drafter.submitAnswer("customer-satisfaction");
			drafter.submitAnswer("Faster login");
			bizValueDrafter?.finalizeItemWithData(1, {
				type: "customer-satisfaction",
				value: "Faster login",
			});

			// Stakeholders - finalize as we go
			drafter.submitAnswer("PM");
			const stakeholdersDrafter = drafter.getArrayDrafter("stakeholders");
			stakeholdersDrafter?.setDescriptions(["PM"]);

			drafter.submitAnswer(
				"Project Manager, John Smith, Delivery timeline concerns, john@example.com",
			);
			stakeholdersDrafter?.finalizeItemWithData(0, {
				role: "project-manager",
				name: "John Smith",
				interest: "Delivery timeline concerns",
				email: "john@example.com",
			});

			// User stories - finalize as we go
			drafter.submitAnswer("Login story");
			const userStoriesDrafter = drafter.getArrayDrafter("user_stories");
			userStoriesDrafter?.setDescriptions(["Login story"]);

			drafter.submitAnswer("user");
			drafter.submitAnswer("login with email and password");
			drafter.submitAnswer("access my account");
			userStoriesDrafter?.finalizeItemWithData(0, {
				role: "user",
				feature: "login with email and password",
				benefit: "access my account",
			});

			// Criteria - finalize as we go
			drafter.submitAnswer("Valid credentials accepted");
			const criteriaDrafter = drafter.getArrayDrafter("criteria");
			criteriaDrafter?.setDescriptions(["Valid credentials accepted"]);

			drafter.submitAnswer(
				"Users with valid credentials can login successfully. This ensures security and prevents unauthorized access.",
			);
			drafter.submitAnswer(""); // cr-q-002: research (optional)
			criteriaDrafter?.finalizeItemWithData(0, {
				id: "crit-001",
				description: "Users with valid credentials can login successfully",
				rationale: "This ensures security and prevents unauthorized access",
				status: "needs-review" as const,
			});

			// Now get all prefilled data
			const prefilledData = drafter.getPrefilledArrayData();

			// All arrays should be prefilled
			expect(prefilledData.business_value).toHaveLength(2);
			expect(prefilledData.stakeholders).toHaveLength(1);
			expect(prefilledData.user_stories).toHaveLength(1);
			expect(prefilledData.criteria).toHaveLength(1);

			// Verify all questions are complete
			expect(drafter.questionsComplete).toBe(true);

			// When finalizing, the LLM can merge prefilled data with any computed fields
			const finalData = {
				type: "business-requirement" as const,
				number: 1,
				slug: "user-authentication",
				name: "User Authentication",
				description: "Secure login system",
				priority: "high" as const,
				status: {
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					verified: false,
					verified_at: null,
					notes: [],
				},
				...prefilledData, // Prefill with already-finalized array data
			};

			// Finalize the parent entity
			drafter.finalize(finalData);

			expect(drafter.isComplete).toBe(true);
			expect(drafter.data.business_value).toHaveLength(2);
			expect(drafter.data.stakeholders).toHaveLength(1);
		});
	});

	describe("Error handling", () => {
		it("should throw error when auto-finalizing item with incomplete questions", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			drafter.submitAnswer("Test");
			drafter.submitAnswer("Description");
			drafter.submitAnswer("Revenue");

			const bizValueDrafter = drafter.getArrayDrafter("business_value");
			bizValueDrafter?.setDescriptions(["Revenue"]);

			// Only answer one question, not both
			drafter.submitAnswer("revenue");

			// Try to finalize - should fail
			expect(() => {
				bizValueDrafter?.finalizeItemWithData(0, {
					type: "revenue",
					value: "Value",
				});
			}).toThrow("Cannot finalize item 0: questions not complete");
		});

		it("should throw error when auto-finalizing invalid item index", () => {
			const config = createBusinessRequirementDrafterConfig();
			const drafter = createEntityDrafter(config);

			drafter.submitAnswer("Test");
			drafter.submitAnswer("Description");
			drafter.submitAnswer("Revenue");

			const bizValueDrafter = drafter.getArrayDrafter("business_value");
			bizValueDrafter?.setDescriptions(["Revenue"]);

			// Try to finalize invalid index
			expect(() => {
				bizValueDrafter?.finalizeItemWithData(999, {
					type: "revenue",
					value: "Value",
				});
			}).toThrow("Invalid item index: 999");
		});
	});
});
