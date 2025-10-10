import { describe, expect, it } from "vitest";
import { createConstitutionDrafterConfig } from "../src/drafters/constitution-drafter";
import { createEntityDrafter } from "../src/entity-drafter-factory";

describe("EntityDrafter - Array Field Protection", () => {
	it("should ignore array fields provided in finalize() and use arrayDrafter data instead", () => {
		const config = createConstitutionDrafterConfig();
		const drafter = createEntityDrafter(config);

		// Answer main questions
		drafter.submitAnswer("Test Constitution");
		drafter.submitAnswer("Test description");

		// Answer collection question to create one article
		drafter.submitAnswer("Test Article");

		// Get the articles array drafter and set descriptions
		const arrayDrafter = drafter.getArrayDrafter("articles");
		expect(arrayDrafter).toBeDefined();
		arrayDrafter!.setDescriptions(["Test Article"]);

		// Answer questions for the article item
		const item = arrayDrafter!.getItem(0);
		expect(item).toBeDefined();

		// Answer all item questions using submitAnswer on drafter
		drafter.submitAnswer("Correct Article Title");
		drafter.submitAnswer("Correct principle");
		drafter.submitAnswer("Correct rationale");
		// Skip optional questions - examples and exceptions
		const examplesQ = drafter.findQuestionById("ar-q-004-item-0");
		const exceptionsQ = drafter.findQuestionById("ar-q-005-item-0");
		if (examplesQ) examplesQ.question.skipped = true;
		if (exceptionsQ) exceptionsQ.question.skipped = true;
		drafter.submitAnswer("active");

		// Finalize the array item with correct data
		arrayDrafter!.finalizeItemWithData(0, {
			id: "art-001",
			title: "Correct Article Title",
			principle: "Correct principle",
			rationale: "Correct rationale",
			examples: [],
			exceptions: [],
			status: "active",
		});

		// Verify array drafter has the correct finalized data
		const finalizedArrayData = arrayDrafter!.getFinalizedData();
		expect(finalizedArrayData).toHaveLength(1);
		expect(finalizedArrayData[0]?.title).toBe("Correct Article Title");

		// Now finalize the main entity, but MALICIOUSLY try to override the articles array
		// with different data - this should be IGNORED
		drafter.finalize({
			type: "constitution",
			number: 1,
			slug: "test-constitution",
			name: "Test Constitution",
			description: "Test description",
			draft: false,
			priority: "high",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			},
			// THIS SHOULD BE IGNORED! The finalize method should strip this out
			articles: [
				{
					id: "art-999",
					title: "WRONG TITLE - THIS SHOULD BE STRIPPED",
					principle: "Wrong principle",
					rationale: "Wrong rationale",
					examples: [],
					exceptions: [],
					status: "active",
				},
			] as unknown,
		});

		// Verify the finalized entity uses the CORRECT articles from arrayDrafter,
		// NOT the ones we tried to inject
		expect(drafter.isComplete).toBe(true);
		expect(drafter.data.articles).toHaveLength(1);
		expect(drafter.data.articles[0]?.title).toBe("Correct Article Title");
		expect(drafter.data.articles[0]?.id).toBe("art-001");
		expect(drafter.data.articles[0]?.title).not.toBe(
			"WRONG TITLE - THIS SHOULD BE STRIPPED",
		);
	});

	it("should prevent array data injection even when LLM tries to bypass system", () => {
		const config = createConstitutionDrafterConfig();
		const drafter = createEntityDrafter(config);

		// Answer main questions
		drafter.submitAnswer("Test Constitution");
		drafter.submitAnswer("Test description");

		// Answer collection question to create one article
		drafter.submitAnswer("Original Article");

		// Get the articles array drafter and set descriptions
		const arrayDrafter = drafter.getArrayDrafter("articles");
		arrayDrafter!.setDescriptions(["Original Article"]);

		// Answer all item questions
		drafter.submitAnswer("Original Title");
		drafter.submitAnswer("Original principle");
		drafter.submitAnswer("Original rationale");
		// Skip optional questions
		const examplesQ = drafter.findQuestionById("ar-q-004-item-0");
		const exceptionsQ = drafter.findQuestionById("ar-q-005-item-0");
		if (examplesQ) examplesQ.question.skipped = true;
		if (exceptionsQ) exceptionsQ.question.skipped = true;
		drafter.submitAnswer("active");

		// Finalize the array item
		arrayDrafter!.finalizeItemWithData(0, {
			id: "art-001",
			title: "Original Title",
			principle: "Original principle",
			rationale: "Original rationale",
			examples: [],
			exceptions: [],
			status: "active",
		});

		// Now try to finalize with BOTH array data and empty array override
		// BOTH should be ignored
		drafter.finalize({
			type: "constitution",
			number: 1,
			slug: "test-constitution",
			name: "Test Constitution",
			description: "Test description",
			draft: false,
			priority: "high",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			},
			// Try to inject EMPTY array - should be ignored
			articles: [] as unknown,
		});

		// Verify the finalized entity uses the CORRECT articles from arrayDrafter,
		// NOT the empty array we tried to inject
		expect(drafter.isComplete).toBe(true);
		expect(drafter.data.articles).toHaveLength(1);
		expect(drafter.data.articles[0]?.title).toBe("Original Title");
	});
});
