// Quick test to see if depends_on is being stored/retrieved
import { SpecManager } from "@spec-mcp/core";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestPlan,
} from "../../../core/tests/helpers.js";
import { addTask } from "./src/tools/add-task.js";

const tempDir = await createTempDir("debug-test");
const specManager = new SpecManager(tempDir);
await specManager.ensureFolders();

// Create business requirement
const _brd = await specManager.business_requirements.create(
	createTestBusinessRequirement({ slug: "placeholder" }),
);

// Create plan
const plan = await specManager.plans.create(
	createTestPlan({ slug: "test-plan", tasks: [] }),
);
const planId = `pln-${plan.number}`;

console.log("Adding task-001...");
await addTask(specManager, planId, "Foundation");

console.log("Adding task-002 with depends_on...");
const result = await addTask(specManager, planId, "Dependent", {
	depends_on: ["task-001"],
});
console.log("Result:", result.content[0].text);

console.log("\nRetrieving plan...");
const updatedPlan = await specManager.plans.get(plan.number);
console.log("Plan tasks:", JSON.stringify(updatedPlan.tasks, null, 2));

const task2 = updatedPlan.tasks.find((t) => t.id === "task-002");
console.log("\nTask-002 depends_on:", task2?.depends_on);
console.log("Task-002 full:", JSON.stringify(task2, null, 2));

await cleanupTempDir(tempDir);
