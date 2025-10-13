import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { dirname, resolve as resolvePath } from "node:path";
import type { DraftStore, SpecManager } from "@spec-mcp/core";
import { watch } from "chokidar";
import { WebSocketServer } from "ws";
import { setDashboardContext } from "./context.js";

/**
 * Type for Astro middleware handler
 */
type AstroHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	next: (err?: Error) => void,
) => Promise<void>;

export interface DashboardConfig {
	port: number;
	host: string;
	autoOpen?: boolean;
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
 * and serves the built Astro application
 */
export class DashboardServer {
	private wss: WebSocketServer | null = null;
	private fileWatcher: ReturnType<typeof watch> | null = null;
	private httpServer: Server | null = null;
	private astroHandler: AstroHandler | null = null;
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
	 * Start the HTTP server with WebSocket support and Astro SSR handler
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		try {
			// Load the built Astro app handler
			// The built Astro app is in dist/server/entry.mjs
			// Set ASTRO_NODE_AUTOSTART=disabled to prevent automatic server start
			process.env.ASTRO_NODE_AUTOSTART = "disabled";

			// Find the @spec-mcp/dashboard package root to locate the Astro build
			// This works whether running from source or as a bundled dependency
			const packagePath = await import.meta.resolve("@spec-mcp/dashboard");
			const packageUrl = new URL(packagePath);
			const packageDir = dirname(packageUrl.pathname);

			// The Astro build is in dist/server/entry.mjs relative to package root
			// Since we import from dist/index.js, we need to go up to dist and find server/entry.mjs
			const serverEntryPath = resolvePath(packageDir, "../server/entry.mjs");
			const astroApp = await import(serverEntryPath);
			this.astroHandler = astroApp.handler;

			// Create HTTP server
			this.httpServer = createServer(async (req, res) => {
				// Handle the request with Astro's SSR handler (middleware mode)
				if (!this.astroHandler) {
					res.statusCode = 503;
					res.end("Server not ready");
					return;
				}

				try {
					// The Astro handler expects (req, res, next, locals) in middleware mode
					// We provide a next function that handles 404s
					await this.astroHandler(req, res, (err?: Error) => {
						if (err) {
							console.error("Error handling request:", err);
							res.statusCode = 500;
							res.end("Internal Server Error");
						} else {
							// No error but next was called - this means 404
							res.statusCode = 404;
							res.end("Not Found");
						}
					});
				} catch (error) {
					console.error("Error handling request:", error);
					res.statusCode = 500;
					res.end("Internal Server Error");
				}
			});

			// Create WebSocket server on the same HTTP server
			this.wss = new WebSocketServer({ noServer: true });

			// Handle WebSocket upgrade requests
			this.httpServer.on("upgrade", (request, socket, head) => {
				if (request.url === "/ws") {
					this.wss?.handleUpgrade(request, socket, head, (ws) => {
						this.wss?.emit("connection", ws, request);
					});
				} else {
					// Close other upgrade requests
					socket.destroy();
				}
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

			// Start listening
			await new Promise<void>((resolve, reject) => {
				this.httpServer?.listen(this.config.port, this.config.host, () => {
					console.log(
						`Dashboard server running on http://${this.config.host}:${this.config.port}`,
					);
					resolve();
				});
				this.httpServer?.on("error", reject);
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

			this.isRunning = true;
			console.log(
				`Dashboard WebSocket server running on ws://${this.config.host}:${this.config.port}/ws`,
			);
		} catch (error) {
			console.error("Failed to start dashboard server:", error);
			throw error;
		}
	}

	/**
	 * Stop the HTTP server, WebSocket server, and file watcher
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		// Close all WebSocket connections
		if (this.wss) {
			this.wss.clients.forEach((client) => {
				client.close();
			});
			this.wss.close();
			this.wss = null;
		}

		// Stop HTTP server
		if (this.httpServer) {
			await new Promise<void>((resolve) => {
				this.httpServer?.close(() => {
					resolve();
				});
			});
			this.httpServer = null;
		}

		// Stop file watching
		if (this.fileWatcher) {
			await this.fileWatcher.close();
			this.fileWatcher = null;
		}

		this.isRunning = false;
		this.astroHandler = null;
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
			wsUrl: `ws://${this.config.host}:${this.config.port}/ws`,
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
