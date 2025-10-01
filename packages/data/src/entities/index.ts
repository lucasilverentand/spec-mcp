// Re-export all entities
export * from "../core/index.js";
export * from "./components/index.js";
export * from "./constitutions/index.js";
export * from "./plans/index.js";
export * from "./requirements/index.js";
export * from "./shared/index.js";

import type {
	AppComponent,
	LibraryComponent,
	ServiceComponent,
	ToolComponent,
} from "./components/index.js";
import type { Constitution } from "./constitutions/index.js";
import type { Plan } from "./plans/index.js";
import type { Requirement } from "./requirements/index.js";

export type AnyEntity =
	| Plan
	| Requirement
	| AppComponent
	| ServiceComponent
	| LibraryComponent
	| ToolComponent
	| Constitution;
