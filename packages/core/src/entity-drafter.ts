import type { Base, DraftQuestion } from "@spec-mcp/schemas";
import type { ZodType, ZodTypeDef } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface EntityDrafterState<T extends Base> {
	questions: DraftQuestion[];
	data: Partial<T>;
	finalized: boolean;
	arrayDrafters: Record<string, EntityArrayDrafterState<unknown>>;
}

export interface EntityArrayDrafterState<T> {
	question: DraftQuestion;
	items: Array<{
		description: string;
		questions: DraftQuestion[];
		data: Partial<T>;
		finalized: boolean;
	}>;
}

export class EntityDrafter<T extends Base> {
	protected schema: ZodType<T, ZodTypeDef, unknown>;
	public questions: DraftQuestion[];
	public data: Partial<T> = {};
	public finalized: boolean = false;
	protected arrayDrafters: Map<string, EntityArrayDrafter<unknown>> = new Map();

	constructor(
		schema: ZodType<T, ZodTypeDef, unknown>,
		questions: DraftQuestion[],
		arrayDrafters?: Map<string, EntityArrayDrafter<unknown>>,
	) {
		this.schema = schema;
		this.questions = questions;
		if (arrayDrafters) {
			this.arrayDrafters = arrayDrafters;
		}
	}

	currentQuestion(): DraftQuestion | null {
		// First check if there's an unanswered question in the main questions
		const mainQuestion = this.questions.find((q) => q.answer === null);
		if (mainQuestion) {
			return mainQuestion;
		}

		// Then check if any array drafter has unanswered questions
		for (const [_fieldName, arrayDrafter] of this.arrayDrafters) {
			const arrayQuestion = arrayDrafter.currentQuestion();
			if (arrayQuestion) {
				return arrayQuestion.question;
			}
		}

		return null;
	}

	submitAnswer(answer: string): void {
		const question = this.currentQuestion();
		if (!question) {
			throw new Error("All questions have already been answered.");
		}
		question.answer = answer;
	}

	getArrayDrafter<U = unknown>(
		fieldName: string,
	): EntityArrayDrafter<U> | undefined {
		return this.arrayDrafters.get(fieldName) as
			| EntityArrayDrafter<U>
			| undefined;
	}

	/**
	 * Get all array drafters (public accessor)
	 */
	getAllArrayDrafters(): Map<string, EntityArrayDrafter<unknown>> {
		return this.arrayDrafters;
	}

	get questionsComplete(): boolean {
		const mainQuestionsComplete = this.questions.every(
			(q) => q.answer !== null,
		);
		const arrayDraftersComplete = Array.from(this.arrayDrafters.values()).every(
			(drafter) => drafter.isComplete,
		);
		return mainQuestionsComplete && arrayDraftersComplete;
	}

	/**
	 * Get all questions and answers for LLM to generate final entity data.
	 * Includes main questions, array fields status, schema, and clear next steps.
	 */
	getEntityContext(): {
		mainQuestions: Array<{
			id: string;
			question: string;
			answer: string;
		}>;
		arrayFieldsStatus: Record<
			string,
			{ finalized: boolean; itemCount: number }
		>;
		prefilledData: Partial<T>;
		schema: unknown;
		nextStep: {
			action: "finalize_entity";
			method: "finalize";
			parameters: {
				data: string;
			};
			instruction: string;
		};
	} {
		const mainQuestions = this.questions.map((q) => ({
			id: q.id,
			question: q.question,
			answer: q.answer || "",
		}));

		const arrayFieldsStatus: Record<
			string,
			{ finalized: boolean; itemCount: number }
		> = {};

		for (const [fieldName, arrayDrafter] of this.arrayDrafters.entries()) {
			const finalizedData = arrayDrafter.getFinalizedData();
			arrayFieldsStatus[fieldName] = {
				finalized: arrayDrafter.isComplete,
				itemCount: finalizedData.length,
			};
		}

		// Get prefilled array data
		const prefilledData = this.getPrefilledArrayData();

		// Get the JSON schema for the entity
		const jsonSchema = zodToJsonSchema(this.schema, {
			name: "EntitySchema",
			$refStrategy: "none",
		});

		// Build example showing which fields to generate vs use prefilled
		const prefilledFields = Object.keys(prefilledData);

		return {
			mainQuestions,
			arrayFieldsStatus,
			prefilledData,
			schema: jsonSchema,
			nextStep: {
				action: "finalize_entity",
				method: "finalize",
				parameters: {
					data: "Generate complete JSON object by merging Q&A data with prefilled arrays",
				},
				instruction: `
═══════════════════════════════════════════════════════════════
                   FINAL ENTITY GENERATION
═══════════════════════════════════════════════════════════════

TASK: Generate complete entity by merging Q&A with prefilled arrays

ENTITY SCHEMA (JSON Schema format):
${JSON.stringify(jsonSchema, null, 2)}

MAIN QUESTIONS & ANSWERS:
${mainQuestions
	.map(
		(q, i) => `${i + 1}. ${q.question}
   Answer: "${q.answer}"`,
	)
	.join("\n\n")}

ARRAY FIELDS STATUS:
${Object.entries(arrayFieldsStatus)
	.map(
		([field, status]) =>
			`  • ${field}: ${status.finalized ? "✓" : "✗"} (${status.itemCount} items finalized)`,
	)
	.join("\n")}

PREFILLED ARRAY DATA (already finalized):
${JSON.stringify(prefilledData, null, 2)}

FIELDS ALREADY PREFILLED:
${prefilledFields.map((f) => `  • ${f} (use prefilled data)`).join("\n")}

REQUIREMENTS:
✓ Generate fields from mainQuestions Q&A
✓ Use prefilledData for array fields (DO NOT regenerate)
✓ Add computed fields: type, number, slug, status, timestamps
✓ Must conform to the Entity Schema above
✓ Include ALL required fields

EXAMPLE STRUCTURE:
{
  "type": "<entity-type>",
  "number": <next-number>,
  "slug": "<generated-from-title>",
  "name": "<from Q&A>",
  "description": "<from Q&A>",
  ...
  ${prefilledFields.map((f) => `"${f}": <use prefilledData.${f}>`).join(",\n  ")},
  ...
  "status": {
    "created_at": "<ISO timestamp>",
    "updated_at": "<ISO timestamp>",
    "verified": false,
    "verified_at": null,
    "notes": []
  }
}

NEXT ACTION:
Call: drafter.finalize(<your_generated_complete_object>)

═══════════════════════════════════════════════════════════════
				`.trim(),
			},
		};
	}

	/**
	 * Get all finalized data from array drafters, useful for prefilling parent entity.
	 * Returns a partial object with all array fields that have finalized items.
	 */
	getPrefilledArrayData(): Partial<T> {
		const result: Record<string, unknown> = {};

		for (const [fieldName, arrayDrafter] of this.arrayDrafters.entries()) {
			const finalizedData = arrayDrafter.getFinalizedData();
			if (finalizedData.length > 0) {
				result[fieldName] = finalizedData;
			}
		}

		return result as Partial<T>;
	}

	finalize(input: Partial<T>): void {
		if (!this.questionsComplete) {
			throw new Error("Cannot finalize: not all questions have been answered.");
		}

		const { data, error } = this.schema.safeParse(input);
		if (error) {
			throw new Error(`Invalid data: ${error.message}`);
		}

		this.data = data;
		this.finalized = true;
	}

	get isComplete(): boolean {
		return this.finalized && this.schema.safeParse(this.data).success;
	}

	/**
	 * Find a question by ID across main questions and all array items.
	 * @param questionId The unique question ID to find
	 * @returns The question and its context (fieldName and itemIndex if in array)
	 */
	findQuestionById(questionId: string): {
		question: DraftQuestion;
		context:
			| { type: "main" }
			| { type: "collection"; fieldName: string }
			| { type: "item"; fieldName: string; itemIndex: number };
	} | null {
		// Check main questions
		const mainQuestion = this.questions.find((q) => q.id === questionId);
		if (mainQuestion) {
			return { question: mainQuestion, context: { type: "main" } };
		}

		// Check array drafters
		for (const [fieldName, arrayDrafter] of this.arrayDrafters.entries()) {
			// Check collection question
			const collectionQuestion = arrayDrafter.getCollectionQuestion();
			if (collectionQuestion.id === questionId) {
				return {
					question: collectionQuestion,
					context: { type: "collection", fieldName },
				};
			}

			// Check item questions
			for (
				let itemIndex = 0;
				itemIndex < arrayDrafter.items.length;
				itemIndex++
			) {
				const item = arrayDrafter.items[itemIndex];
				if (!item) continue;
				const itemQuestion = item.drafter.questions.find(
					(q) => q.id === questionId,
				);
				if (itemQuestion) {
					return {
						question: itemQuestion,
						context: { type: "item", fieldName, itemIndex },
					};
				}
			}
		}

		return null;
	}

	/**
	 * Answer a specific question by its ID.
	 * @param questionId The unique question ID
	 * @param answer The answer to submit
	 */
	answerQuestionById(questionId: string, answer: string): void {
		const result = this.findQuestionById(questionId);
		if (!result) {
			throw new Error(`Question with ID '${questionId}' not found`);
		}

		const { question, context } = result;

		// If it's a collection question, also set descriptions on array drafter
		if (context.type === "collection") {
			question.answer = answer;
			const arrayDrafter = this.arrayDrafters.get(context.fieldName);
			if (arrayDrafter) {
				// Parse comma-separated descriptions
				const descriptions = answer
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
				arrayDrafter.setDescriptions(descriptions);
			}
		} else {
			// For main and item questions, just set the answer
			question.answer = answer;
		}
	}

	/**
	 * Finalize an entity by entity ID (main or array item).
	 * @param entityId Format: null/"main" for main entity, "fieldName[index]" for array items
	 * @param data The complete data to finalize with
	 */
	finalizeByEntityId(
		entityId: string | null | undefined,
		data: Partial<T>,
	): void {
		// Main entity
		if (!entityId || entityId === "main") {
			this.finalize(data);
			return;
		}

		// Array item: parse "fieldName[index]" format
		const match = entityId.match(/^(\w+)\[(\d+)\]$/);
		if (!match) {
			throw new Error(
				`Invalid entity ID format: '${entityId}'. Expected 'fieldName[index]' or 'main'`,
			);
		}

		const fieldName = match[1];
		const indexStr = match[2];

		if (!fieldName || !indexStr) {
			throw new Error(`Invalid entity ID format: '${entityId}'`);
		}

		const itemIndex = parseInt(indexStr, 10);

		const arrayDrafter = this.arrayDrafters.get(fieldName);
		if (!arrayDrafter) {
			throw new Error(`Array field '${fieldName}' not found`);
		}

		arrayDrafter.finalizeItemWithData(itemIndex, data);
	}

	/**
	 * Get intelligent continuation context for the draft.
	 * Returns what to do next: answer questions or finalize entities.
	 */
	getContinueContext(): {
		stage: "questions" | "finalization" | "complete";
		nextAction: unknown;
	} {
		// Stage 1: Questions need to be answered
		const currentQ = this.currentQuestion();
		if (currentQ) {
			// Find the question context
			const questionContext = this.findQuestionById(currentQ.id);
			return {
				stage: "questions",
				nextAction: {
					action: "answer_question",
					questionId: currentQ.id,
					question: currentQ.question,
					context: questionContext?.context || { type: "main" },
				},
			};
		}

		// Stage 2: Questions complete, need finalization
		if (this.questionsComplete && !this.finalized) {
			// Check if array items need finalization
			for (const [fieldName, arrayDrafter] of this.arrayDrafters.entries()) {
				const incompleteIndices = arrayDrafter.incompletItemIndices;
				if (incompleteIndices.length > 0) {
					const itemIndex = incompleteIndices[0];
					if (itemIndex !== undefined) {
						const context = arrayDrafter.getItemContext(itemIndex);
						return {
							stage: "finalization",
							nextAction: {
								action: "finalize_entity",
								entityId: `${fieldName}[${itemIndex}]`,
								context: context,
							},
						};
					}
				}
			}

			// All array items finalized, finalize main entity
			const entityContext = this.getEntityContext();
			return {
				stage: "finalization",
				nextAction: {
					action: "finalize_entity",
					entityId: "main",
					context: entityContext,
				},
			};
		}

		// Stage 3: Complete
		return {
			stage: "complete",
			nextAction: {
				action: "complete",
				message: "Draft is finalized and ready to be saved as a spec",
			},
		};
	}

	toJSON(): EntityDrafterState<T> {
		const arrayDrafters: Record<string, EntityArrayDrafterState<unknown>> = {};
		for (const [key, drafter] of this.arrayDrafters.entries()) {
			arrayDrafters[key] = drafter.toJSON();
		}

		return {
			questions: this.questions,
			data: this.data,
			finalized: this.finalized,
			arrayDrafters,
		};
	}

	static fromJSON<T extends Base>(
		schema: ZodType<T, ZodTypeDef, unknown>,
		state: EntityDrafterState<T>,
	): EntityDrafter<T> {
		const arrayDrafters = new Map<string, EntityArrayDrafter<unknown>>();
		for (const [key, drafterState] of Object.entries(state.arrayDrafters)) {
			arrayDrafters.set(key, EntityArrayDrafter.fromJSON(schema, drafterState));
		}

		const drafter = new EntityDrafter<T>(
			schema,
			state.questions,
			arrayDrafters,
		);
		drafter.data = state.data;
		drafter.finalized = state.finalized;

		return drafter;
	}
}

class EntityDraftArrayItem<T> {
	drafter: {
		schema: ZodType<T, ZodTypeDef, unknown>;
		questions: DraftQuestion[];
		data: Partial<T>;
		finalized: boolean;
		questionsComplete: boolean;
		isComplete: boolean;
		currentQuestion(): DraftQuestion | null;
		submitAnswer(answer: string): void;
		finalize(input: Partial<T>): void;
	};
	description: string;

	constructor(
		schema: ZodType<T, ZodTypeDef, unknown>,
		questions: DraftQuestion[],
		description: string,
	) {
		this.description = description;
		this.drafter = {
			schema,
			questions,
			data: {},
			finalized: false,
			get questionsComplete() {
				return this.questions.every((q) => q.answer !== null);
			},
			get isComplete() {
				return this.finalized && this.schema.safeParse(this.data).success;
			},
			currentQuestion() {
				return this.questions.find((q) => q.answer === null) || null;
			},
			submitAnswer(answer: string) {
				const question = this.currentQuestion();
				if (!question) {
					throw new Error("All questions have already been answered.");
				}
				question.answer = answer;
			},
			finalize(input: Partial<T>) {
				if (!this.questionsComplete) {
					throw new Error(
						"Cannot finalize: not all questions have been answered.",
					);
				}
				const { data, error } = this.schema.safeParse(input);
				if (error) {
					throw new Error(`Invalid data: ${error.message}`);
				}
				this.data = data;
				this.finalized = true;
			},
		};
	}
}

export class EntityArrayDrafter<T> {
	protected schema: ZodType<T, ZodTypeDef, unknown>;
	protected question: DraftQuestion;
	protected _items: EntityDraftArrayItem<T>[] = [];
	protected item_questions_template: DraftQuestion[] = [];

	constructor(
		schema: ZodType<T, ZodTypeDef, unknown>,
		question: DraftQuestion,
		item_questions: DraftQuestion[],
	) {
		this.schema = schema;
		this.question = question;
		this.item_questions_template = item_questions;
	}

	get items(): readonly EntityDraftArrayItem<T>[] {
		return this._items;
	}

	setDescriptions(descriptions: string[]) {
		this._items = descriptions.map(
			(desc) =>
				new EntityDraftArrayItem<T>(
					this.schema,
					// Create a deep copy of questions for each item
					this.item_questions_template.map((q) => ({ ...q })),
					desc,
				),
		);
	}

	/**
	 * Get the collection question (public accessor for protected property)
	 */
	getCollectionQuestion(): DraftQuestion {
		return this.question;
	}

	currentQuestion(): {
		item: EntityDraftArrayItem<T> | null;
		question: DraftQuestion;
	} | null {
		// If collection question hasn't been answered, return it first
		if (this.question.answer === null) {
			// Return a dummy item with the collection question
			// The item will be null since this is the array-level question
			return { item: null, question: this.question };
		}

		// Otherwise, return questions from items (skip already finalized items)
		for (const item of this.items) {
			// Skip items that are already finalized - they're done!
			if (item.drafter.isComplete) {
				continue;
			}

			const question = item.drafter.currentQuestion();
			if (question) {
				return { item, question };
			}
		}
		return null;
	}

	submitAnswer(itemIndex: number, answer: string): void {
		const item = this._items[itemIndex];
		if (!item) {
			throw new Error(`Invalid item index: ${itemIndex}`);
		}
		item.drafter.submitAnswer(answer);
	}

	finalizeItem(itemIndex: number, data: Partial<T>): void {
		const item = this._items[itemIndex];
		if (!item) {
			throw new Error(`Invalid item index: ${itemIndex}`);
		}
		item.drafter.finalize(data);
	}

	getItem(index: number): EntityDraftArrayItem<T> | undefined {
		return this._items[index];
	}

	get nextItemToFinalize(): EntityDraftArrayItem<T> | null {
		return (
			this._items.find(
				(item) => item.drafter.questionsComplete && !item.drafter.isComplete,
			) || null
		);
	}

	/**
	 * Get the questions and answers for an item, with schema for LLM to generate final data.
	 * @param itemIndex Index of the item
	 * @returns Object with description, Q&A pairs, schema, and next steps
	 */
	getItemContext(itemIndex: number): {
		description: string;
		questionsAndAnswers: Array<{
			id: string;
			question: string;
			answer: string;
		}>;
		schema: unknown;
		nextStep: {
			action: "finalize_item";
			method: "finalizeItemWithData";
			parameters: {
				itemIndex: number;
				data: string; // "Generate JSON object matching the schema above"
			};
			instruction: string;
		};
	} | null {
		const item = this.getItem(itemIndex);
		if (!item) {
			return null;
		}

		// Get the JSON schema for the item type
		const jsonSchema = zodToJsonSchema(this.schema, {
			name: "ItemSchema",
			$refStrategy: "none",
		});

		return {
			description: item.description,
			questionsAndAnswers: item.drafter.questions.map((q) => ({
				id: q.id,
				question: q.question,
				answer: q.answer || "",
			})),
			schema: jsonSchema,
			nextStep: {
				action: "finalize_item",
				method: "finalizeItemWithData",
				parameters: {
					itemIndex,
					data: "Generate JSON object matching the schema above, using the Q&A to populate fields",
				},
				instruction: `
═══════════════════════════════════════════════════════════════
                        NEXT STEP
═══════════════════════════════════════════════════════════════

TASK: Generate a JSON object for item #${itemIndex}

SCHEMA (JSON Schema format):
${JSON.stringify(jsonSchema, null, 2)}

QUESTIONS & ANSWERS PROVIDED:
${item.drafter.questions
	.map(
		(q, i) => `${i + 1}. ${q.question}
   Answer: "${q.answer || "<not answered>"}"`,
	)
	.join("\n\n")}

REQUIREMENTS:
✓ Must conform to the JSON Schema above
✓ Use the answers to populate each field
✓ Include ALL required fields from schema
✓ Convert types appropriately (strings to numbers, booleans, etc.)
✓ Follow enum constraints if present

NEXT ACTION:
Call: arrayDrafter.finalizeItemWithData(${itemIndex}, <your_generated_json_object>)

═══════════════════════════════════════════════════════════════
				`.trim(),
			},
		};
	}

	/**
	 * Finalize an array item with LLM-generated data.
	 * This should be called after the LLM has reviewed the Q&A and generated schema-compliant data.
	 * @param itemIndex Index of the item to finalize
	 * @param data The complete data for this item (generated by LLM from Q&A)
	 */
	finalizeItemWithData(itemIndex: number, data: Partial<T>): void {
		const item = this.getItem(itemIndex);
		if (!item) {
			throw new Error(`Invalid item index: ${itemIndex}`);
		}
		if (!item.drafter.questionsComplete) {
			throw new Error(
				`Cannot finalize item ${itemIndex}: questions not complete`,
			);
		}
		item.drafter.finalize(data);
	}

	/**
	 * Get all finalized item data, useful for prefilling when finalizing parent entity
	 */
	getFinalizedData(): T[] {
		return this._items
			.filter((item) => item.drafter.isComplete)
			.map((item) => item.drafter.data as T);
	}

	/**
	 * Get indices of items that still need finalization
	 */
	get incompletItemIndices(): number[] {
		return this._items
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => !item.drafter.isComplete)
			.map(({ index }) => index);
	}

	get isComplete(): boolean {
		// Collection question must be answered
		if (this.question.answer === null) {
			return false;
		}
		// All items must be complete
		return (
			this._items.length > 0 &&
			this._items.every((item) => item.drafter.isComplete)
		);
	}

	getData(): T[] {
		if (!this.isComplete) {
			throw new Error("Cannot get data: drafting is not complete");
		}
		return this._items.map((item) => item.drafter.data as T);
	}

	toJSON(): EntityArrayDrafterState<T> {
		return {
			question: this.question,
			items: this._items.map((item) => ({
				description: item.description,
				questions: item.drafter.questions,
				data: item.drafter.data,
				finalized: item.drafter.finalized,
			})),
		};
	}

	static fromJSON<T>(
		schema: ZodType<T, ZodTypeDef, unknown>,
		state: EntityArrayDrafterState<T>,
	): EntityArrayDrafter<T> {
		// Extract template questions from first item if available
		const firstItem = state.items[0];
		const template = firstItem
			? firstItem.questions.map((q) => ({ ...q, answer: null }))
			: [];

		const drafter = new EntityArrayDrafter<T>(schema, state.question, template);

		// Reconstruct items
		drafter._items = state.items.map((itemState) => {
			const item = new EntityDraftArrayItem<T>(
				schema,
				itemState.questions,
				itemState.description,
			);
			item.drafter.data = itemState.data;
			item.drafter.finalized = itemState.finalized;
			return item;
		});

		return drafter;
	}
}
