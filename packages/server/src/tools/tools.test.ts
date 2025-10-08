import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDraftTool } from "./create-draft.js";
import { submitDraftAnswerTool } from "./submit-draft-answer.js";
import { createRequirementTool } from "./create-requirement.js";
import { createComponentTool } from "./create-component.js";
import { createPlanTool } from "./create-plan.js";
import { createConstitutionTool } from "./create-constitution.js";
import { createDecisionTool } from "./create-decision.js";
import type { EntityType } from "@spec-mcp/schemas";

// Create mock functions
const mockCreateDraft = vi.fn();
const mockGetDraft = vi.fn();
const mockSubmitAnswer = vi.fn();
const mockIsComplete = vi.fn();
const mockCreateFromDraft = vi.fn();
const mockDeleteDraft = vi.fn();
const mockRequirementsCreate = vi.fn();
const mockComponentsCreate = vi.fn();
const mockPlansCreate = vi.fn();
const mockConstitutionsCreate = vi.fn();
const mockDecisionsCreate = vi.fn();

// Mock the core dependencies
vi.mock("@spec-mcp/core", () => ({
	FileManager: vi.fn().mockImplementation(() => ({})),
	RequirementDraftManager: vi.fn().mockImplementation(() => ({
		createDraft: mockCreateDraft,
		getDraft: mockGetDraft,
		submitAnswer: mockSubmitAnswer,
		isComplete: mockIsComplete,
		createFromDraft: mockCreateFromDraft,
		deleteDraft: mockDeleteDraft,
	})),
	ComponentDraftManager: vi.fn().mockImplementation(() => ({
		createDraft: mockCreateDraft,
		getDraft: mockGetDraft,
		submitAnswer: mockSubmitAnswer,
		isComplete: mockIsComplete,
		createFromDraft: mockCreateFromDraft,
		deleteDraft: mockDeleteDraft,
	})),
	PlanDraftManager: vi.fn().mockImplementation(() => ({
		createDraft: mockCreateDraft,
		getDraft: mockGetDraft,
		submitAnswer: mockSubmitAnswer,
		isComplete: mockIsComplete,
		createFromDraft: mockCreateFromDraft,
		deleteDraft: mockDeleteDraft,
	})),
	ConstitutionDraftManager: vi.fn().mockImplementation(() => ({
		createDraft: mockCreateDraft,
		getDraft: mockGetDraft,
		submitAnswer: mockSubmitAnswer,
		isComplete: mockIsComplete,
		createFromDraft: mockCreateFromDraft,
		deleteDraft: mockDeleteDraft,
	})),
	DecisionDraftManager: vi.fn().mockImplementation(() => ({
		createDraft: mockCreateDraft,
		getDraft: mockGetDraft,
		submitAnswer: mockSubmitAnswer,
		isComplete: mockIsComplete,
		createFromDraft: mockCreateFromDraft,
		deleteDraft: mockDeleteDraft,
	})),
	SpecManager: vi.fn().mockImplementation(() => ({
		requirements: {
			create: mockRequirementsCreate,
		},
		components: {
			create: mockComponentsCreate,
		},
		plans: {
			create: mockPlansCreate,
		},
		constitutions: {
			create: mockConstitutionsCreate,
		},
		decisions: {
			create: mockDecisionsCreate,
		},
	})),
}));

// Mock logger
vi.mock("../utils/logger.js", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe("Tool Functions", () => {
	beforeEach(() => {
		// Clear call history but keep implementations
		mockCreateDraft.mockClear();
		mockGetDraft.mockClear();
		mockSubmitAnswer.mockClear();
		mockIsComplete.mockClear();
		mockCreateFromDraft.mockClear();
		mockDeleteDraft.mockClear();
		mockRequirementsCreate.mockClear();
		mockComponentsCreate.mockClear();
		mockPlansCreate.mockClear();
		mockConstitutionsCreate.mockClear();
		mockDecisionsCreate.mockClear();
	});

	describe("createDraftTool", () => {
		describe("Success Paths", () => {
			it("should create a requirement draft successfully", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-001",
					firstQuestion: "What is the requirement about?",
					totalQuestions: 5,
				});

				const result = await createDraftTool(
					"requirement",
					"Test Requirement",
				);

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-001");
				expect(result.first_question).toBe(
					"What is the requirement about?",
				);
				expect(result.total_questions).toBe(5);
				expect(result.guidance).toBeDefined();
				expect(result.guidance).toContain("requirement");
				expect(result.guidance).toContain("draft-001");
			});

			it("should create a component draft successfully", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-002",
					firstQuestion: "What component are you creating?",
					totalQuestions: 7,
				});

				const result = await createDraftTool("component", "Test Component");

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-002");
				expect(result.total_questions).toBe(7);
			});

			it("should create a plan draft successfully", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-003",
					firstQuestion: "What is the plan objective?",
					totalQuestions: 6,
				});

				const result = await createDraftTool("plan", "Test Plan");

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-003");
			});

			it("should create a constitution draft successfully", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-004",
					firstQuestion: "What principles guide this constitution?",
					totalQuestions: 4,
				});

				const result = await createDraftTool(
					"constitution",
					"Test Constitution",
				);

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-004");
			});

			it("should create a decision draft successfully", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-005",
					firstQuestion: "What decision needs to be made?",
					totalQuestions: 3,
				});

				const result = await createDraftTool("decision", "Test Decision");

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-005");
			});

			it("should accept custom specs path", async () => {
				mockCreateDraft.mockResolvedValue({
					draftId: "draft-006",
					firstQuestion: "Question?",
					totalQuestions: 5,
				});

				const result = await createDraftTool(
					"requirement",
					"Test",
					"/custom/path",
				);

				expect(result.success).toBe(true);
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid entity type", async () => {
				const result = await createDraftTool(
					"invalid" as EntityType,
					"Test",
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid type");
				expect(result.error).toContain("requirement");
			});

			it("should handle draft manager creation error", async () => {
				mockCreateDraft.mockRejectedValue(
					new Error("Failed to create draft"),
				);

				const result = await createDraftTool("requirement", "Test");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Failed to create draft");
			});

			it("should handle non-Error exceptions", async () => {
				mockCreateDraft.mockRejectedValue("String error");

				const result = await createDraftTool("requirement", "Test");

				expect(result.success).toBe(false);
				expect(result.error).toContain("String error");
			});
		});
	});

	describe("submitDraftAnswerTool", () => {
		describe("Success Paths", () => {
			it("should submit answer and get next question", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test Requirement",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 0,
				});

				mockSubmitAnswer.mockResolvedValue({
					draftId: "draft-001",
					completed: false,
					nextQuestion: "What is the next step?",
					currentQuestionIndex: 1,
					totalQuestions: 5,
				});

				const result = await submitDraftAnswerTool(
					"draft-001",
					"This is my answer",
				);

				expect(result.success).toBe(true);
				expect(result.draft_id).toBe("draft-001");
				expect(result.completed).toBe(false);
				expect(result.next_question).toBe("What is the next step?");
				expect(result.current_question_index).toBe(1);
				expect(result.total_questions).toBe(5);
				expect(result.guidance).toBeDefined();
				expect(result.guidance).toContain("Question 2 of 5");
			});

			it("should complete draft when all questions answered", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test Requirement",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 4,
				});

				mockSubmitAnswer.mockResolvedValue({
					draftId: "draft-001",
					completed: true,
					totalQuestions: 5,
				});

				const result = await submitDraftAnswerTool(
					"draft-001",
					"Final answer",
				);

				expect(result.success).toBe(true);
				expect(result.completed).toBe(true);
				expect(result.guidance).toBeDefined();
				expect(result.guidance).toContain("All Questions Answered");
				expect(result.guidance).toContain("create_requirement");
			});

			it("should find draft in different manager types", async () => {
				// First manager returns null, second returns the draft
				mockGetDraft
					.mockResolvedValueOnce(null)
					.mockResolvedValueOnce({
						name: "Test Component",
						type: "component",
						questions: [],
						currentQuestionIndex: 0,
					});

				mockSubmitAnswer.mockResolvedValue({
					draftId: "draft-002",
					completed: false,
					nextQuestion: "Next?",
					currentQuestionIndex: 1,
					totalQuestions: 7,
				});

				const result = await submitDraftAnswerTool(
					"draft-002",
					"Answer",
				);

				expect(result.success).toBe(true);
			});

			it("should trim whitespace from answer", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 0,
				});

				mockSubmitAnswer.mockResolvedValue({
					draftId: "draft-001",
					completed: false,
					nextQuestion: "Next?",
					currentQuestionIndex: 1,
					totalQuestions: 5,
				});

				const result = await submitDraftAnswerTool(
					"draft-001",
					"  answer with spaces  ",
				);

				expect(result.success).toBe(true);
				expect(mockSubmitAnswer).toHaveBeenCalledWith(
					"draft-001",
					"answer with spaces",
				);
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await submitDraftAnswerTool("invalid-id", "Answer");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject empty answer", async () => {
				const result = await submitDraftAnswerTool("draft-001", "");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Answer cannot be empty");
			});

			it("should reject whitespace-only answer", async () => {
				const result = await submitDraftAnswerTool("draft-001", "   ");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Answer cannot be empty");
			});

			it("should return error when draft not found", async () => {
				// All managers return null
				mockGetDraft.mockResolvedValue(null);

				const result = await submitDraftAnswerTool(
					"draft-999",
					"Answer",
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should handle submit answer error", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 0,
				});

				mockSubmitAnswer.mockRejectedValue(new Error("Submit failed"));

				const result = await submitDraftAnswerTool(
					"draft-001",
					"Answer",
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain("Submit failed");
			});
		});
	});

	describe("createRequirementTool", () => {
		describe("Success Paths", () => {
			it("should create requirement from completed draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "User Authentication",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 5,
				});

				mockIsComplete.mockResolvedValue(true);

				mockCreateFromDraft.mockResolvedValue({
					name: "User Authentication",
					description: "Users must authenticate",
					priority: "critical",
				});

				mockRequirementsCreate.mockResolvedValue({
					number: 1,
					slug: "user-authentication",
					name: "User Authentication",
					description: "Users must authenticate",
					priority: "critical",
				});

				mockDeleteDraft.mockResolvedValue(undefined);

				const result = await createRequirementTool("draft-001");

				expect(result.success).toBe(true);
				expect(result.requirement).toBeDefined();
				expect(result.entity_id).toBe("req-001-user-authentication");
				expect(result.message).toContain("created successfully");
				expect(mockDeleteDraft).toHaveBeenCalledWith("draft-001");
			});

			it("should merge additional data when provided", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 5,
				});

				mockIsComplete.mockResolvedValue(true);

				mockCreateFromDraft.mockResolvedValue({
					name: "Test",
					description: "Original",
				});

				mockRequirementsCreate.mockResolvedValue({
					number: 2,
					slug: "test",
					name: "Test",
					description: "Overridden",
				});

				const result = await createRequirementTool(
					"draft-001",
					{ description: "Overridden" },
				);

				expect(result.success).toBe(true);
				expect(mockRequirementsCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						description: "Overridden",
					}),
				);
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await createRequirementTool("invalid");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject when draft not found", async () => {
				mockGetDraft.mockResolvedValue(null);

				const result = await createRequirementTool("draft-999");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should reject wrong draft type", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "component",
					questions: [],
					currentQuestionIndex: 5,
				});

				const result = await createRequirementTool("draft-001");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft type mismatch");
				expect(result.error).toContain("component");
			});

			it("should reject incomplete draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [1, 2, 3, 4, 5],
					currentQuestionIndex: 2,
				});

				mockIsComplete.mockResolvedValue(false);

				const result = await createRequirementTool("draft-001");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not complete");
				expect(result.error).toContain("3 questions remaining");
			});

			it("should handle creation error", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 5,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({});
				mockRequirementsCreate.mockRejectedValue(
					new Error("Creation failed"),
				);

				const result = await createRequirementTool("draft-001");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Creation failed");
			});
		});
	});

	describe("createComponentTool", () => {
		describe("Success Paths", () => {
			it("should create component from completed draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Auth Service",
					type: "component",
					questions: [],
					currentQuestionIndex: 7,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({
					name: "Auth Service",
				});

				mockComponentsCreate.mockResolvedValue({
					number: 5,
					slug: "auth-service",
					name: "Auth Service",
				});

				const result = await createComponentTool("draft-002");

				expect(result.success).toBe(true);
				expect(result.component).toBeDefined();
				expect(result.entity_id).toBe("cmp-005-auth-service");
			});

			it("should merge additional data", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "component",
					questions: [],
					currentQuestionIndex: 7,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({});
				mockComponentsCreate.mockResolvedValue({
					number: 1,
					slug: "test",
				});

				const result = await createComponentTool("draft-002", {
					extra: "data",
				});

				expect(result.success).toBe(true);
				expect(mockComponentsCreate).toHaveBeenCalledWith(
					expect.objectContaining({ extra: "data" }),
				);
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await createComponentTool("invalid");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject when draft not found", async () => {
				mockGetDraft.mockResolvedValue(null);

				const result = await createComponentTool("draft-999");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should reject wrong draft type", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "requirement",
					questions: [],
					currentQuestionIndex: 7,
				});

				const result = await createComponentTool("draft-002");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft type mismatch");
			});

			it("should reject incomplete draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "component",
					questions: [1, 2, 3, 4, 5, 6, 7],
					currentQuestionIndex: 3,
				});

				mockIsComplete.mockResolvedValue(false);

				const result = await createComponentTool("draft-002");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not complete");
				expect(result.error).toContain("4 questions remaining");
			});
		});
	});

	describe("createPlanTool", () => {
		describe("Success Paths", () => {
			it("should create plan from completed draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Q4 Implementation",
					type: "plan",
					questions: [],
					currentQuestionIndex: 6,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({
					name: "Q4 Implementation",
				});

				mockPlansCreate.mockResolvedValue({
					number: 3,
					slug: "q4-implementation",
					name: "Q4 Implementation",
				});

				const result = await createPlanTool("draft-003");

				expect(result.success).toBe(true);
				expect(result.plan).toBeDefined();
				expect(result.entity_id).toBe("pln-003-q4-implementation");
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await createPlanTool("invalid");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject when draft not found", async () => {
				mockGetDraft.mockResolvedValue(null);

				const result = await createPlanTool("draft-999");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should reject wrong draft type", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "decision",
					questions: [],
					currentQuestionIndex: 6,
				});

				const result = await createPlanTool("draft-003");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft type mismatch");
			});

			it("should reject incomplete draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "plan",
					questions: [1, 2, 3, 4, 5, 6],
					currentQuestionIndex: 2,
				});

				mockIsComplete.mockResolvedValue(false);

				const result = await createPlanTool("draft-003");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not complete");
			});
		});
	});

	describe("createConstitutionTool", () => {
		describe("Success Paths", () => {
			it("should create constitution from completed draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Code Standards",
					type: "constitution",
					questions: [],
					currentQuestionIndex: 4,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({
					name: "Code Standards",
				});

				mockConstitutionsCreate.mockResolvedValue({
					number: 2,
					slug: "code-standards",
					name: "Code Standards",
				});

				const result = await createConstitutionTool("draft-004");

				expect(result.success).toBe(true);
				expect(result.constitution).toBeDefined();
				expect(result.entity_id).toBe("con-002-code-standards");
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await createConstitutionTool("invalid");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject when draft not found", async () => {
				mockGetDraft.mockResolvedValue(null);

				const result = await createConstitutionTool("draft-999");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should reject wrong draft type", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "plan",
					questions: [],
					currentQuestionIndex: 4,
				});

				const result = await createConstitutionTool("draft-004");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft type mismatch");
			});

			it("should reject incomplete draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "constitution",
					questions: [1, 2, 3, 4],
					currentQuestionIndex: 1,
				});

				mockIsComplete.mockResolvedValue(false);

				const result = await createConstitutionTool("draft-004");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not complete");
			});
		});
	});

	describe("createDecisionTool", () => {
		describe("Success Paths", () => {
			it("should create decision from completed draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Tech Stack",
					type: "decision",
					questions: [],
					currentQuestionIndex: 3,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({
					name: "Tech Stack",
				});

				mockDecisionsCreate.mockResolvedValue({
					number: 1,
					slug: "tech-stack",
					name: "Tech Stack",
				});

				const result = await createDecisionTool("draft-005");

				expect(result.success).toBe(true);
				expect(result.decision).toBeDefined();
				expect(result.entity_id).toBe("dec-001-tech-stack");
			});

			it("should merge additional data", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "decision",
					questions: [],
					currentQuestionIndex: 3,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({});
				mockDecisionsCreate.mockResolvedValue({
					number: 1,
					slug: "test",
				});

				const result = await createDecisionTool("draft-005", {
					custom: "field",
				});

				expect(result.success).toBe(true);
				expect(mockDecisionsCreate).toHaveBeenCalledWith(
					expect.objectContaining({ custom: "field" }),
				);
			});
		});

		describe("Error Paths", () => {
			it("should reject invalid draft_id format", async () => {
				const result = await createDecisionTool("invalid");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid draft_id format");
			});

			it("should reject when draft not found", async () => {
				mockGetDraft.mockResolvedValue(null);

				const result = await createDecisionTool("draft-999");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft not found");
			});

			it("should reject wrong draft type", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "constitution",
					questions: [],
					currentQuestionIndex: 3,
				});

				const result = await createDecisionTool("draft-005");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Draft type mismatch");
			});

			it("should reject incomplete draft", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "decision",
					questions: [1, 2, 3],
					currentQuestionIndex: 1,
				});

				mockIsComplete.mockResolvedValue(false);

				const result = await createDecisionTool("draft-005");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not complete");
			});

			it("should handle creation error", async () => {
				mockGetDraft.mockResolvedValue({
					name: "Test",
					type: "decision",
					questions: [],
					currentQuestionIndex: 3,
				});

				mockIsComplete.mockResolvedValue(true);
				mockCreateFromDraft.mockResolvedValue({});
				mockDecisionsCreate.mockRejectedValue(
					new Error("Database error"),
				);

				const result = await createDecisionTool("draft-005");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Database error");
			});
		});
	});

	describe("Integration Tests", () => {
		it("should handle full creation flow for requirement", async () => {
			// Create draft
			mockCreateDraft.mockResolvedValue({
				draftId: "draft-100",
				firstQuestion: "What is the requirement?",
				totalQuestions: 2,
			});

			const createResult = await createDraftTool(
				"requirement",
				"Test Req",
			);
			expect(createResult.success).toBe(true);

			// Submit first answer
			mockGetDraft.mockResolvedValue({
				name: "Test Req",
				type: "requirement",
				questions: [],
				currentQuestionIndex: 0,
			});

			mockSubmitAnswer.mockResolvedValue({
				draftId: "draft-100",
				completed: false,
				nextQuestion: "Second question?",
				currentQuestionIndex: 1,
				totalQuestions: 2,
			});

			const submit1 = await submitDraftAnswerTool(
				"draft-100",
				"First answer",
			);
			expect(submit1.success).toBe(true);
			expect(submit1.completed).toBe(false);

			// Submit second answer
			mockSubmitAnswer.mockResolvedValue({
				draftId: "draft-100",
				completed: true,
				totalQuestions: 2,
			});

			const submit2 = await submitDraftAnswerTool(
				"draft-100",
				"Second answer",
			);
			expect(submit2.success).toBe(true);
			expect(submit2.completed).toBe(true);

			// Create requirement
			mockIsComplete.mockResolvedValue(true);
			mockCreateFromDraft.mockResolvedValue({
				name: "Test Req",
			});

			mockRequirementsCreate.mockResolvedValue({
				number: 10,
				slug: "test-req",
				name: "Test Req",
			});

			const finalResult = await createRequirementTool("draft-100");
			expect(finalResult.success).toBe(true);
			expect(finalResult.entity_id).toBe("req-010-test-req");
		});

		it("should prevent creating entity from incomplete draft", async () => {
			// Create draft
			mockCreateDraft.mockResolvedValue({
				draftId: "draft-101",
				firstQuestion: "Question?",
				totalQuestions: 5,
			});

			const createResult = await createDraftTool("component", "Test");
			expect(createResult.success).toBe(true);

			// Try to create component without completing all questions
			mockGetDraft.mockResolvedValue({
				name: "Test",
				type: "component",
				questions: [1, 2, 3, 4, 5],
				currentQuestionIndex: 2,
			});

			mockIsComplete.mockResolvedValue(false);

			const finalResult = await createComponentTool("draft-101");
			expect(finalResult.success).toBe(false);
			expect(finalResult.error).toContain("not complete");
		});
	});

	describe("Edge Cases", () => {
		it("should handle extremely long answers", async () => {
			mockGetDraft.mockResolvedValue({
				name: "Test",
				type: "requirement",
				questions: [],
				currentQuestionIndex: 0,
			});

			mockSubmitAnswer.mockResolvedValue({
				draftId: "draft-001",
				completed: false,
				nextQuestion: "Next?",
				currentQuestionIndex: 1,
				totalQuestions: 5,
			});

			const longAnswer = "x".repeat(10000);
			const result = await submitDraftAnswerTool("draft-001", longAnswer);

			expect(result.success).toBe(true);
			expect(mockSubmitAnswer).toHaveBeenCalledWith(
				"draft-001",
				longAnswer,
			);
		});

		it("should handle special characters in answers", async () => {
			mockGetDraft.mockResolvedValue({
				name: "Test",
				type: "requirement",
				questions: [],
				currentQuestionIndex: 0,
			});

			mockSubmitAnswer.mockResolvedValue({
				draftId: "draft-001",
				completed: false,
				nextQuestion: "Next?",
				currentQuestionIndex: 1,
				totalQuestions: 5,
			});

			const specialAnswer = "Test with $pecial ch@rs & symbols <>";
			const result = await submitDraftAnswerTool(
				"draft-001",
				specialAnswer,
			);

			expect(result.success).toBe(true);
		});

		it("should handle unicode characters in entity names", async () => {
			mockCreateDraft.mockResolvedValue({
				draftId: "draft-001",
				firstQuestion: "Question?",
				totalQuestions: 5,
			});

			const result = await createDraftTool(
				"requirement",
				"测试要求 Test Тест",
			);

			expect(result.success).toBe(true);
		});

		it("should handle number padding correctly in entity IDs", async () => {
			mockGetDraft.mockResolvedValue({
				name: "Test",
				type: "requirement",
				questions: [],
				currentQuestionIndex: 5,
			});

			mockIsComplete.mockResolvedValue(true);
			mockCreateFromDraft.mockResolvedValue({});

			// Test single digit
			mockRequirementsCreate.mockResolvedValue({
				number: 1,
				slug: "test",
			});
			let result = await createRequirementTool("draft-001");
			expect(result.entity_id).toBe("req-001-test");

			// Test double digit
			mockRequirementsCreate.mockResolvedValue({
				number: 42,
				slug: "test",
			});
			result = await createRequirementTool("draft-002");
			expect(result.entity_id).toBe("req-042-test");

			// Test triple digit
			mockRequirementsCreate.mockResolvedValue({
				number: 999,
				slug: "test",
			});
			result = await createRequirementTool("draft-003");
			expect(result.entity_id).toBe("req-999-test");
		});

		it("should handle missing optional parameters gracefully", async () => {
			mockCreateDraft.mockResolvedValue({
				draftId: "draft-001",
				firstQuestion: "Question?",
				totalQuestions: 5,
			});

			// Call without optional specsPath
			const result = await createDraftTool("requirement", "Test");

			expect(result.success).toBe(true);
		});
	});
});
