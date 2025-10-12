import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import type { DraftStore, SpecManager } from "@spec-mcp/core";
import { watch } from "chokidar";
import { WebSocketServer } from "ws";
import { setDashboardContext } from "./context.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DashboardConfig {
	port: number;
	host: string;
	autoOpen?: boolean;
	specsPath?: string;
	mode?: "development" | "production";
}

export interface DashboardMessage {
	type:
		| "draft:created"
		| "draft:updated"
		| "draft:finalized"
		| "spec:created"
		| "spec:updated"
		| "spec:deleted"
		| "connection:established";
	data?: unknown;
	timestamp: string;
}

/**
 * Dashboard server that manages WebSocket connections, file watching,
 * and the Astro dev/preview server for real-time updates to the dashboard UI
 */
export class DashboardServer {
	private wss: WebSocketServer | null = null;
	private fileWatcher: ReturnType<typeof watch> | null = null;
	private astroProcess: ChildProcess | null = null;
	private isRunning = false;

	constructor(
		private specManager: SpecManager,
		draftStore: DraftStore,
		private config: DashboardConfig,
	) {
		// Set the global context for API routes
		setDashboardContext(specManager, draftStore);
	}

	/**
	 * Start the WebSocket server and Astro dev/preview server
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		// Create WebSocket server
		this.wss = new WebSocketServer({
			port: this.config.port + 1, // Use port+1 for WebSocket
			host: this.config.host,
		});

		// Handle WebSocket connections
		this.wss.on("connection", (ws) => {
			console.log("Dashboard client connected");

			// Send connection established message
			this.sendMessage(ws, {
				type: "connection:established",
				timestamp: new Date().toISOString(),
			});

			ws.on("close", () => {
				console.log("Dashboard client disconnected");
			});

			ws.on("error", (error) => {
				console.error("WebSocket error:", error);
			});
		});

		// Watch spec files for changes
		const specsPath = this.specManager.getBasePath();
		this.fileWatcher = watch(`${specsPath}/**/*.{yaml,yml}`, {
			persistent: true,
			ignoreInitial: true,
		});

		this.fileWatcher
			.on("add", (path) => {
				this.broadcast({
					type: "spec:created",
					data: { path },
					timestamp: new Date().toISOString(),
				});
			})
			.on("change", (path) => {
				this.broadcast({
					type: "spec:updated",
					data: { path },
					timestamp: new Date().toISOString(),
				});
			})
			.on("unlink", (path) => {
				this.broadcast({
					type: "spec:deleted",
					data: { path },
					timestamp: new Date().toISOString(),
				});
			});

		// Watch draft store for changes
		this.setupDraftWatchers();

		// Start Astro server
		await this.startAstroServer();

		this.isRunning = true;
		console.log(
			`Dashboard WebSocket server running on ws://${this.config.host}:${this.config.port + 1}`,
		);
	}

	/**
	 * Stop the WebSocket server, file watcher, and Astro server
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		// Stop Astro server
		if (this.astroProcess) {
			this.astroProcess.kill("SIGTERM");
			this.astroProcess = null;
		}

		// Close all WebSocket connections
		if (this.wss) {
			this.wss.clients.forEach((client) => {
				client.close();
			});
			this.wss.close();
			this.wss = null;
		}

		// Stop file watching
		if (this.fileWatcher) {
			await this.fileWatcher.close();
			this.fileWatcher = null;
		}

		this.isRunning = false;
		console.log("Dashboard server stopped");
	}

	/**
	 * Broadcast a message to all connected clients
	 */
	private broadcast(message: DashboardMessage): void {
		if (!this.wss) {
			return;
		}

		const payload = JSON.stringify(message);
		this.wss.clients.forEach((client) => {
			if (client.readyState === 1) {
				// OPEN
				client.send(payload);
			}
		});
	}

	/**
	 * Send a message to a specific client
	 */
	private sendMessage(
		client: import("ws").WebSocket,
		message: DashboardMessage,
	): void {
		if (client.readyState === 1) {
			// OPEN
			client.send(JSON.stringify(message));
		}
	}

	/**
	 * Start the Astro dev or preview server
	 */
	private async startAstroServer(): Promise<void> {
		return new Promise((resolvePromise, reject) => {
			const dashboardPackagePath = resolvePath(__dirname, "../..");
			const mode = this.config.mode || "development";
			const command = mode === "production" ? "preview" : "dev";

			// Use npx to run astro from the dashboard package
			this.astroProcess = spawn(
				"npx",
				[
					"astro",
					command,
					"--host",
					this.config.host,
					"--port",
					this.config.port.toString(),
				],
				{
					cwd: dashboardPackagePath,
					stdio: ["ignore", "pipe", "pipe"],
					env: {
						...process.env,
						NODE_ENV: mode,
					},
				},
			);

			let serverStarted = false;

			// Listen for server ready message
			this.astroProcess.stdout?.on("data", (data: Buffer) => {
				const output = data.toString();
				// Look for Astro's ready message
				if (
					!serverStarted &&
					(output.includes("ready in") ||
						output.includes("Local") ||
						output.includes("listening on"))
				) {
					serverStarted = true;
					console.log(
						`Dashboard HTTP server running on http://${this.config.host}:${this.config.port}`,
					);
					resolvePromise();
				}
			});

			this.astroProcess.stderr?.on("data", (data: Buffer) => {
				const error = data.toString();
				// Only log actual errors, not warnings
				if (error.toLowerCase().includes("error")) {
					console.error("Astro error:", error);
				}
			});

			this.astroProcess.on("error", (error) => {
				console.error("Failed to start Astro server:", error);
				reject(error);
			});

			this.astroProcess.on("exit", (code, signal) => {
				if (code !== 0 && code !== null && this.isRunning) {
					console.error(
						`Astro server exited with code ${code} (signal: ${signal})`,
					);
				}
			});

			// Timeout after 30 seconds if server doesn't start
			setTimeout(() => {
				if (!serverStarted) {
					console.warn(
						"Astro server did not emit ready message, but may be running",
					);
					resolvePromise();
				}
			}, 30000);
		});
	}

	/**
	 * Set up watchers for draft store events
	 */
	private setupDraftWatchers(): void {
		// Note: This is a simplified implementation
		// In a real implementation, you'd want to hook into the DraftStore
		// to emit events when drafts are created, updated, or finalized
		// For now, we'll rely on the API endpoints to trigger these events
		// when the client makes requests
	}

	/**
	 * Get the current status of the dashboard server
	 */
	getStatus(): {
		running: boolean;
		clients: number;
		wsUrl: string;
	} {
		return {
			running: this.isRunning,
			clients: this.wss?.clients.size || 0,
			wsUrl: `ws://${this.config.host}:${this.config.port + 1}`,
		};
	}

	/**
	 * Notify clients of a draft event
	 */
	notifyDraftEvent(
		type: "draft:created" | "draft:updated" | "draft:finalized",
		data: unknown,
	): void {
		this.broadcast({
			type,
			data,
			timestamp: new Date().toISOString(),
		});
	}
}
