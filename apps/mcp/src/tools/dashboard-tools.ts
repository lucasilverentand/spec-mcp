/**
 * Dashboard management tools
 * Provides tools to control the dashboard server (start, stop, open in browser)
 */

import { spawn } from "node:child_process";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DashboardServer } from "@spec-mcp/dashboard";

/**
 * Start the dashboard server
 */
export async function startDashboard(
	dashboardServer: DashboardServer | null,
): Promise<CallToolResult> {
	if (!dashboardServer) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not initialized. Set ENABLE_DASHBOARD=true in your environment.",
				},
			],
		};
	}

	const status = dashboardServer.getStatus();
	if (status.running) {
		return {
			content: [
				{
					type: "text",
					text: `Dashboard is already running at http://${process.env.DASHBOARD_HOST || "localhost"}:${process.env.DASHBOARD_PORT || "3737"}`,
				},
			],
		};
	}

	try {
		await dashboardServer.start();
		const host = process.env.DASHBOARD_HOST || "localhost";
		const port = process.env.DASHBOARD_PORT || "3737";

		return {
			content: [
				{
					type: "text",
					text: `Dashboard started successfully!\n\nHTTP: http://${host}:${port}\nWebSocket: ws://${host}:${Number.parseInt(port, 10) + 1}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Failed to start dashboard: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Stop the dashboard server
 */
export async function stopDashboard(
	dashboardServer: DashboardServer | null,
): Promise<CallToolResult> {
	if (!dashboardServer) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not initialized.",
				},
			],
		};
	}

	const status = dashboardServer.getStatus();
	if (!status.running) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not currently running.",
				},
			],
		};
	}

	try {
		await dashboardServer.stop();

		return {
			content: [
				{
					type: "text",
					text: "Dashboard stopped successfully.",
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Failed to stop dashboard: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Get dashboard status
 */
export async function getDashboardStatus(
	dashboardServer: DashboardServer | null,
): Promise<CallToolResult> {
	if (!dashboardServer) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not initialized. Set ENABLE_DASHBOARD=true in your environment.",
				},
			],
		};
	}

	const status = dashboardServer.getStatus();
	const host = process.env.DASHBOARD_HOST || "localhost";
	const port = process.env.DASHBOARD_PORT || "3737";

	if (status.running) {
		return {
			content: [
				{
					type: "text",
					text: `Dashboard Status:
- Running: Yes
- HTTP URL: http://${host}:${port}
- WebSocket URL: ${status.wsUrl}
- Connected Clients: ${status.clients}`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: "text",
				text: "Dashboard Status:\n- Running: No",
			},
		],
	};
}

/**
 * Open the dashboard in the default browser
 */
export async function openDashboard(
	dashboardServer: DashboardServer | null,
): Promise<CallToolResult> {
	if (!dashboardServer) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not initialized. Set ENABLE_DASHBOARD=true in your environment.",
				},
			],
		};
	}

	const status = dashboardServer.getStatus();
	if (!status.running) {
		return {
			content: [
				{
					type: "text",
					text: "Dashboard is not currently running. Please start it first using start_dashboard.",
				},
			],
		};
	}

	const host = process.env.DASHBOARD_HOST || "localhost";
	const port = process.env.DASHBOARD_PORT || "3737";
	const url = `http://${host}:${port}`;

	try {
		// Determine the command based on the platform
		const platform = process.platform;
		let command: string;
		let args: string[];

		if (platform === "darwin") {
			// macOS
			command = "open";
			args = [url];
		} else if (platform === "win32") {
			// Windows
			command = "start";
			args = [url];
		} else {
			// Linux and others
			command = "xdg-open";
			args = [url];
		}

		// Spawn the command to open the browser
		const child = spawn(command, args, {
			detached: true,
			stdio: "ignore",
		});

		child.unref();

		return {
			content: [
				{
					type: "text",
					text: `Opening dashboard in browser: ${url}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Failed to open dashboard in browser: ${error instanceof Error ? error.message : String(error)}\n\nYou can manually open: ${url}`,
				},
			],
			isError: true,
		};
	}
}

// Tool definitions for MCP registration
export const startDashboardTool = {
	name: "start_dashboard",
	description:
		"Start the dashboard server. The dashboard provides a web-based interface for managing specs and drafts.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
};

export const stopDashboardTool = {
	name: "stop_dashboard",
	description: "Stop the dashboard server.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
};

export const getDashboardStatusTool = {
	name: "get_dashboard_status",
	description:
		"Get the current status of the dashboard server, including whether it's running and connection information.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
};

export const openDashboardTool = {
	name: "open_dashboard",
	description:
		"Open the dashboard in the default web browser. The dashboard must be running first.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
};
