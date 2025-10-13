import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpecManager } from "@spec-mcp/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root (go up from packages/dashboard/src/lib to root)
const projectRoot = path.resolve(__dirname, "../../../../");
const specsDir = path.join(projectRoot, "specs");

let specManagerInstance: SpecManager | null = null;

export function getSpecManager() {
	if (!specManagerInstance) {
		specManagerInstance = new SpecManager(specsDir);
	}
	return specManagerInstance;
}

export function getSpecsDirectory() {
	return specsDir;
}
