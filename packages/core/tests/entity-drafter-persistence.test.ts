import {
	type BusinessRequirement,
	BusinessRequirementSchema,
	type DraftQuestion,
} from "@spec-mcp/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EntityArrayDrafter, EntityDrafter } from "../src/entity-drafter";
import { EntityManager } from "../src/entity-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
} from "./helpers";

describe("EntityDrafter Persistence", () => {
	let tempDir: string;
	let entityManager: EntityManager<BusinessRequirement>;

	beforeEach(async () => {
		tempDir = await createTempDir("drafter-persistence-test");
		entityManager = new EntityManager<BusinessRequirement>({
			folderPath: tempDir,
			subFolder: "requirements/business",
			idPrefix: "breq",
			entityType: "business-requirement",
			schema: BusinessRequirementSchema,
		});
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("EntityDrafter Serialization", () => {
		it("should serialize and deserialize a simple drafter", () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "What is the name?", answer: null },
				{ id: "q2", question: "What is the description?", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			// Answer first question
			drafter.submitAnswer("Test Name");

			// Serialize
			const state = drafter.toJSON();

			// Deserialize
			const restored = EntityDrafter.fromJSON(BusinessRequirementSchema, state);

			// Verify state is preserved
			expect(restored.currentQuestion()?.id).toBe("q2");
			expect(restored.questionsComplete).toBe(false);
		});

		it("should preserve answered questions during serialization", () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question 1", answer: null },
				{ id: "q2", question: "Question 2", answer: null },
				{ id: "q3", question: "Question 3", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			drafter.submitAnswer("Answer 1");
			drafter.submitAnswer("Answer 2");

			const state = drafter.toJSON();
			const restored = EntityDrafter.fromJSON(BusinessRequirementSchema, state);

			// Check that answers are preserved
			expect(state.questions[0].answer).toBe("Answer 1");
			expect(state.questions[1].answer).toBe("Answer 2");
			expect(state.questions[2].answer).toBe(null);

			// Next question should be q3
			expect(restored.currentQuestion()?.id).toBe("q3");
		});

		it("should serialize finalized state", () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "What is the name?", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			drafter.submitAnswer("Test");

			const testData = {
				...createTestBusinessRequirement({
					slug: "test-slug",
					name: "Test Name",
				}),
				number: 1,
			};

			drafter.finalize(testData);

			const state = drafter.toJSON();
			const restored = EntityDrafter.fromJSON(BusinessRequirementSchema, state);

			expect(restored.isComplete).toBe(true);
			expect(restored.questionsComplete).toBe(true);
		});
	});

	describe("EntityArrayDrafter Serialization", () => {
		it("should serialize and deserialize array drafter with items", () => {
			const arrayQuestion: DraftQuestion = {
				id: "array_q",
				question: "Describe the items",
				answer: "Item 1, Item 2", // Answer the collection question
			};

			const itemQuestions: DraftQuestion[] = [
				{ id: "item_q1", question: "Item question 1", answer: null },
				{ id: "item_q2", question: "Item question 2", answer: null },
			];

			const arrayDrafter = new EntityArrayDrafter(
				BusinessRequirementSchema,
				arrayQuestion,
				itemQuestions,
			);

			// Set up items (collection question already answered)
			arrayDrafter.setDescriptions(["Item 1", "Item 2"]);

			// Answer first item's first question
			arrayDrafter.submitAnswer(0, "Answer 1");

			// Serialize
			const state = arrayDrafter.toJSON();

			// Deserialize
			const restored = EntityArrayDrafter.fromJSON(
				BusinessRequirementSchema,
				state,
			);

			// Verify structure
			expect(restored.items).toHaveLength(2);
			expect(restored.items[0].description).toBe("Item 1");
			expect(restored.items[1].description).toBe("Item 2");

			// Verify current question is the second question of first item
			const currentQ = restored.currentQuestion();
			expect(currentQ?.item?.description).toBe("Item 1");
			expect(currentQ?.question.id).toBe("item_q2-item-0");
		});
	});

	describe("EntityDrafter with EntityArrayDrafter", () => {
		it("should serialize drafter with nested array drafters", () => {
			const mainQuestions: DraftQuestion[] = [
				{ id: "main_q1", question: "Main question 1", answer: null },
			];

			const arrayQuestion: DraftQuestion = {
				id: "array_q",
				question: "Array question",
				answer: "Item 1", // Answer the collection question
			};

			const itemQuestions: DraftQuestion[] = [
				{ id: "item_q1", question: "Item question", answer: null },
			];

			const arrayDrafter = new EntityArrayDrafter(
				BusinessRequirementSchema,
				arrayQuestion,
				itemQuestions,
			);
			arrayDrafter.setDescriptions(["Item 1"]);

			const arrayDrafters = new Map([["items", arrayDrafter]]);

			const drafter = new EntityDrafter(
				BusinessRequirementSchema,
				mainQuestions,
				arrayDrafters,
			);

			// Answer main question
			drafter.submitAnswer("Main answer");

			// Serialize
			const state = drafter.toJSON();

			// Deserialize
			const restored = EntityDrafter.fromJSON(BusinessRequirementSchema, state);

			// Verify array drafter is preserved
			const restoredArrayDrafter = restored.getArrayDrafter("items");
			expect(restoredArrayDrafter).toBeDefined();
			expect(restoredArrayDrafter?.items).toHaveLength(1);
		});
	});

	describe("EntityManager Draft Persistence", () => {
		it("should save and load a draft", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "What is the name?", answer: null },
				{ id: "q2", question: "What is the description?", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			drafter.submitAnswer("Test Name");

			// Save draft
			const draftNumber = await entityManager.saveDraft(drafter);

			expect(draftNumber).toBe(1);

			// Load draft
			const loadedDrafter = await entityManager.loadDraft(draftNumber);

			expect(loadedDrafter).not.toBeNull();
			expect(loadedDrafter?.currentQuestion()?.id).toBe("q2");
			expect(loadedDrafter?.questionsComplete).toBe(false);
		});

		it("should update existing draft", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question 1", answer: null },
				{ id: "q2", question: "Question 2", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			drafter.submitAnswer("Answer 1");

			// Save initial draft
			const draftNumber = await entityManager.saveDraft(drafter);

			// Answer second question
			drafter.submitAnswer("Answer 2");

			// Update draft (same number)
			await entityManager.saveDraft(drafter, draftNumber);

			// Load draft
			const loadedDrafter = await entityManager.loadDraft(draftNumber);

			expect(loadedDrafter?.questionsComplete).toBe(true);
		});

		it("should check if draft exists", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			const draftNumber = await entityManager.saveDraft(drafter);

			const exists = await entityManager.draftExists(draftNumber);
			expect(exists).toBe(true);

			const notExists = await entityManager.draftExists(999);
			expect(notExists).toBe(false);
		});

		it("should delete a draft", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			const draftNumber = await entityManager.saveDraft(drafter);

			await entityManager.deleteDraft(draftNumber);

			const exists = await entityManager.draftExists(draftNumber);
			expect(exists).toBe(false);
		});

		it("should list all drafts", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question", answer: null },
			];

			const drafter1 = new EntityDrafter(BusinessRequirementSchema, questions);
			const drafter2 = new EntityDrafter(BusinessRequirementSchema, questions);

			// Explicitly provide numbers to avoid collision
			await entityManager.saveDraft(drafter1, 1);
			await entityManager.saveDraft(drafter2, 2);

			const drafts = await entityManager.listDrafts();

			expect(drafts).toHaveLength(2);
			expect(drafts).toEqual([1, 2]);
		});

		it("should promote a completed draft to entity", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			drafter.submitAnswer("Answer");

			const testData = {
				...createTestBusinessRequirement({
					slug: "promoted-entity",
					name: "Promoted Entity",
				}),
				number: 1,
			};

			drafter.finalize(testData);

			// Save as draft first
			const draftNumber = await entityManager.saveDraft(drafter);

			// Promote to entity
			const entity = await entityManager.promoteDraft(drafter);

			expect(entity.slug).toBe("promoted-entity");
			expect(entity.name).toBe("Promoted Entity");

			// Draft should be deleted
			const draftExists = await entityManager.draftExists(draftNumber);
			expect(draftExists).toBe(false);

			// Entity should exist
			const entityExists = await entityManager.entityExists(entity.number);
			expect(entityExists).toBe(true);
		});

		it("should throw error when promoting incomplete draft", async () => {
			const questions: DraftQuestion[] = [
				{ id: "q1", question: "Question", answer: null },
			];

			const drafter = new EntityDrafter(BusinessRequirementSchema, questions);

			// Don't answer questions or finalize

			await expect(entityManager.promoteDraft(drafter)).rejects.toThrow(
				"Cannot promote draft: drafter is not complete",
			);
		});
	});
});
