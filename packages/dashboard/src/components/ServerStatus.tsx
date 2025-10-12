import { Activity, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWebSocketClient } from "@/lib/websocket-client";

interface ServerStatusData {
	running: boolean;
	clients: number;
	uptime: number;
}

export function ServerStatus() {
	const [status, setStatus] = useState<ServerStatusData>({
		running: false,
		clients: 0,
		uptime: 0,
	});
	const [wsConnected, setWsConnected] = useState(false);

	useEffect(() => {
		// Fetch server status
		const fetchStatus = () => {
			fetch("/api/status")
				.then((res) => res.json())
				.then((data) => setStatus(data))
				.catch((error) => console.error("Failed to fetch status:", error));
		};

		fetchStatus();
		const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds

		// Set up WebSocket for connection status
		const wsClient = createWebSocketClient();
		wsClient.connect();

		const unsubscribe = wsClient.subscribe((message) => {
			if (message.type === "connection:established") {
				setWsConnected(true);
			}
		});

		// Check connection status periodically
		const wsInterval = setInterval(() => {
			setWsConnected(wsClient.isConnected());
		}, 1000);

		return () => {
			clearInterval(interval);
			clearInterval(wsInterval);
			unsubscribe();
			wsClient.disconnect();
		};
	}, []);

	const formatUptime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Activity className="h-4 w-4" />
						Server Status
					</CardTitle>
					<Badge variant={status.running ? "default" : "destructive"}>
						{status.running ? "Running" : "Offline"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground flex items-center gap-2">
							<Circle
								className={`h-2 w-2 ${wsConnected ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
							/>
							WebSocket
						</span>
						<span className="font-medium">
							{wsConnected ? "Connected" : "Disconnected"}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Active Clients</span>
						<span className="font-medium">{status.clients}</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Uptime</span>
						<span className="font-medium">{formatUptime(status.uptime)}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
