// Import version directly from package.json
// TypeScript's resolveJsonModule allows this import
// When bundled with tsup, the version string will be inlined
import packageJson from "../../package.json" assert { type: "json" };

/**
 * Version string from package.json
 * This ensures the version is always in sync with the package.json
 */
export const VERSION = packageJson.version;
