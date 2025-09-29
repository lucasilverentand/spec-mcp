import { describe, expect, it } from "vitest";
import {
	FileActionSchema,
	TaskFileSchema,
	TaskIdSchema,
	TaskPrioritySchema,
	TaskSchema,
} from "../../../src/entities/shared/task-schema.js";

describe("TaskIdSchema", () => {
	it("should accept valid task IDs", () => {
		const validIds = ["task-001", "task-999", "task-042"];

		for (const id of validIds) {
			expect(() => TaskIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid task IDs", () => {
		const invalidIds = [
			"task-1", // not padded
			"task-abc", // non-numeric
			"tsk-001", // wrong prefix
			"task-001-extra", // extra suffix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => TaskIdSchema.parse(id)).toThrow();
		}
	});
});

describe("TaskPrioritySchema", () => {
	it("should accept valid task priorities", () => {
		const validPriorities = ["critical", "high", "normal", "low", "optional"];

		for (const priority of validPriorities) {
			expect(() => TaskPrioritySchema.parse(priority)).not.toThrow();
		}
	});

	it("should reject invalid task priorities", () => {
		const invalidPriorities = [
			"urgent",
			"medium",
			"cancelled",
			"",
			null,
			undefined,
		];

		for (const priority of invalidPriorities) {
			expect(() => TaskPrioritySchema.parse(priority)).toThrow();
		}
	});
});

describe("FileActionSchema", () => {
	it("should accept valid file actions", () => {
		const validActions = ["create", "modify", "delete"];

		for (const action of validActions) {
			expect(() => FileActionSchema.parse(action)).not.toThrow();
		}
	});

	it("should reject invalid file actions", () => {
		const invalidActions = ["update", "remove", "add", "", null, undefined];

		for (const action of invalidActions) {
			expect(() => FileActionSchema.parse(action)).toThrow();
		}
	});
});

describe("TaskFileSchema", () => {
	it("should accept valid task file", () => {
		const validFile = {
			path: "src/component.ts",
			action: "create",
		};

		expect(() => TaskFileSchema.parse(validFile)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const file = {
			path: "src/component.ts",
			action: "create",
		};

		const parsed = TaskFileSchema.parse(file);
		expect(parsed.applied).toBe(false);
	});

	it("should accept complete file with all fields", () => {
		const completeFile = {
			path: "src/component.ts",
			action: "modify",
			action_description: "Add new method to component",
			applied: true,
		};

		const parsed = TaskFileSchema.parse(completeFile);
		expect(parsed.path).toBe("src/component.ts");
		expect(parsed.action).toBe("modify");
		expect(parsed.action_description).toBe("Add new method to component");
		expect(parsed.applied).toBe(true);
	});

	it("should validate file paths", () => {
		const invalidPaths = [
			"invalid file path with spaces",
			"path with @ symbol",
			"",
		];

		for (const path of invalidPaths) {
			const fileWithInvalidPath = {
				path,
				action: "create",
			};
			expect(() => TaskFileSchema.parse(fileWithInvalidPath)).toThrow();
		}
	});

	it("should accept valid file paths", () => {
		const validPaths = [
			"src/component.ts",
			"tests/component.test.ts",
			"./relative-path.js",
			"deep/nested/file.tsx",
			"file-with-dashes.js",
		];

		for (const path of validPaths) {
			const fileWithValidPath = {
				path,
				action: "create",
			};
			expect(() => TaskFileSchema.parse(fileWithValidPath)).not.toThrow();
		}
	});
});

describe("TaskSchema", () => {
	it("should accept minimal valid task", () => {
		const validTask = {
			id: "task-001",
			description: "Complete the implementation",
		};

		expect(() => TaskSchema.parse(validTask)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const task = {
			id: "task-001",
			description: "Complete the implementation",
		};

		const parsed = TaskSchema.parse(task);

		expect(parsed.priority).toBe("normal");
		expect(parsed.depends_on).toEqual([]);
		expect(parsed.considerations).toEqual([]);
		expect(parsed.references).toEqual([]);
		expect(parsed.files).toEqual([]);
		expect(parsed.completed).toBe(false);
		expect(parsed.verified).toBe(false);
		expect(parsed.notes).toEqual([]);
	});

	it("should accept complete task with all fields", () => {
		const completeTask = {
			id: "task-001",
			description: "Complete the implementation",
			priority: "high",
			depends_on: ["task-002", "task-003"],
			considerations: ["Consider performance impact"],
			files: [
				{
					path: "src/component.ts",
					action: "create",
					action_description: "Create new component",
				},
			],
			completed: true,
			completed_at: "2023-12-01T10:30:00.000Z",
			verified: true,
			verified_at: "2023-12-01T11:00:00.000Z",
			notes: ["Task completed successfully"],
		};

		const parsed = TaskSchema.parse(completeTask);
		expect(parsed.priority).toBe("high");
		expect(parsed.depends_on).toEqual(["task-002", "task-003"]);
		expect(parsed.considerations).toEqual(["Consider performance impact"]);
		expect(parsed.files).toHaveLength(1);
		expect(parsed.completed).toBe(true);
		expect(parsed.verified).toBe(true);
		expect(parsed.notes).toEqual(["Task completed successfully"]);
	});

	it("should require mandatory fields", () => {
		const requiredFields = ["id", "description"];

		for (const field of requiredFields) {
			const invalidTask = {
				id: "task-001",
				description: "Test description",
			};
			delete (invalidTask as Record<string, unknown>)[field];

			expect(() => TaskSchema.parse(invalidTask)).toThrow();
		}
	});

	it("should reject empty description", () => {
		const task = {
			id: "task-001",
			description: "",
		};

		expect(() => TaskSchema.parse(task)).toThrow();
	});

	it("should validate depends_on task IDs", () => {
		const taskWithInvalidDependency = {
			id: "task-001",
			description: "Test task",
			depends_on: ["invalid-id"],
		};

		expect(() => TaskSchema.parse(taskWithInvalidDependency)).toThrow();
	});
});
