import type { DashboardMessage } from "./dashboard-server";

type MessageHandler = (message: DashboardMessage) => void;

/**
 * WebSocket client for the dashboard
 * This runs in the browser and connects to the dashboard server
 */
export class DashboardWebSocketClient {
	private ws: WebSocket | null = null;
	private handlers: Set<MessageHandler> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectTimeout: number | null = null;

	constructor(private url: string) {}

	/**
	 * Connect to the WebSocket server
	 */
	connect(): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			return;
		}

		try {
			this.ws = new WebSocket(this.url);

			this.ws.onopen = () => {
				console.log("Connected to dashboard WebSocket");
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data) as DashboardMessage;
					this.handlers.forEach((handler) => {
						handler(message);
					});
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			this.ws.onclose = () => {
				console.log("Disconnected from dashboard WebSocket");
				this.attemptReconnect();
			};

			this.ws.onerror = (error) => {
				console.error("WebSocket error:", error);
			};
		} catch (error) {
			console.error("Failed to create WebSocket connection:", error);
			this.attemptReconnect();
		}
	}

	/**
	 * Disconnect from the WebSocket server
	 */
	disconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Subscribe to WebSocket messages
	 */
	subscribe(handler: MessageHandler): () => void {
		this.handlers.add(handler);
		return () => {
			this.handlers.delete(handler);
		};
	}

	/**
	 * Attempt to reconnect to the WebSocket server
	 */
	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error("Max reconnection attempts reached");
			return;
		}

		this.reconnectAttempts++;
		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

		console.log(
			`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
		);

		this.reconnectTimeout = window.setTimeout(() => {
			this.connect();
		}, delay);
	}

	/**
	 * Get the current connection status
	 */
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

/**
 * Create a WebSocket client instance
 */
export function createWebSocketClient(): DashboardWebSocketClient {
	// Determine WebSocket URL based on current location
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const url = `${protocol}//${window.location.host}/ws`;

	return new DashboardWebSocketClient(url);
}
