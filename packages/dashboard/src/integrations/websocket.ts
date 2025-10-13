import type { Server } from "node:http";
import type { AstroIntegration } from "astro";
import { WebSocketServer } from "ws";
import { onFileChange, startFileWatcher } from "../lib/file-watcher";

export function websocketIntegration(): AstroIntegration {
	let wss: WebSocketServer | null = null;

	return {
		name: "websocket-integration",
		hooks: {
			"astro:server:setup": ({ server }) => {
				// biome-ignore lint/suspicious/noExplicitAny: Astro server type doesn't expose httpServer
				const httpServer = (server as any).httpServer as Server;

				if (!httpServer) {
					console.warn("[WebSocket] HTTP server not available");
					return;
				}

				// Create WebSocket server on the same HTTP server
				wss = new WebSocketServer({ noServer: true });

				// Handle upgrade requests - only for our specific /ws path
				httpServer.on("upgrade", (request, socket, head) => {
					if (request.url === "/ws") {
						wss?.handleUpgrade(request, socket, head, (ws) => {
							wss?.emit("connection", ws, request);
						});
					}
					// Let other upgrade requests (like Astro's HMR) pass through
				});

				wss.on("connection", (ws) => {
					console.log("[WebSocket] Client connected");

					// Send initial connection message
					ws.send(
						JSON.stringify({
							type: "connection:established",
							timestamp: new Date().toISOString(),
						}),
					);

					ws.on("close", () => {
						console.log("[WebSocket] Client disconnected");
					});
				});

				// Start file watcher and broadcast changes
				startFileWatcher();
				onFileChange((event) => {
					console.log(`[WebSocket] Broadcasting event: ${event.type}`);
					const message = JSON.stringify({
						type: event.type,
						data: { path: event.path },
						timestamp: new Date().toISOString(),
					});

					wss?.clients.forEach((client) => {
						if (client.readyState === 1) {
							// WebSocket.OPEN
							client.send(message);
						}
					});
				});

				console.log("[WebSocket] Server initialized");
			},
			"astro:server:done": () => {
				if (wss) {
					wss.close();
					wss = null;
					console.log("[WebSocket] Server closed");
				}
			},
		},
	};
}
