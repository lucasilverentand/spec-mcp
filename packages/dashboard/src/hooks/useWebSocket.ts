import { useEffect, useRef, useState } from "react";

type FileChangeEvent = {
	type:
		| "spec:created"
		| "spec:updated"
		| "spec:deleted"
		| "draft:created"
		| "draft:updated"
		| "draft:finalized"
		| "connection:established";
	path?: string;
	timestamp: string;
};

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(onMessage?: (event: FileChangeEvent) => void) {
	const [status, setStatus] = useState<WebSocketStatus>("disconnected");
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const connect = () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				return;
			}

			setStatus("connecting");

			// Connect to WebSocket server
			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

			ws.onopen = () => {
				console.log("[WebSocket Client] Connected");
				setStatus("connected");
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as FileChangeEvent;
					console.log("[WebSocket Client] Received:", data);
					onMessage?.(data);
				} catch (error) {
					console.error("[WebSocket Client] Failed to parse message:", error);
				}
			};

			ws.onerror = (error) => {
				console.error("[WebSocket Client] Error:", error);
				setStatus("error");
			};

			ws.onclose = () => {
				console.log("[WebSocket Client] Disconnected");
				setStatus("disconnected");
				wsRef.current = null;

				// Attempt to reconnect after 3 seconds
				reconnectTimeoutRef.current = setTimeout(() => {
					console.log("[WebSocket Client] Attempting to reconnect...");
					connect();
				}, 3000);
			};

			wsRef.current = ws;
		};

		connect();

		// Cleanup on unmount
		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [onMessage]);

	return { status };
}
