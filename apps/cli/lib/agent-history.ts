import { AGENT_HISTORY_PATH, CACHE_DIR } from "@/utils/paths";
import { log } from "@clack/prompts";
import fs from "fs";

export function loadHistory(): string[] {
	try {
		if (!fs.existsSync(CACHE_DIR)) {
			fs.mkdirSync(CACHE_DIR, { recursive: true });
		}
		if (fs.existsSync(AGENT_HISTORY_PATH)) {
			const historyData = fs.readFileSync(AGENT_HISTORY_PATH, "utf-8");
			// Return non-empty lines, limit history size if needed
			return historyData.split("\n").filter(Boolean).slice(-100);
			// Example: Keep last 100
		}
	} catch (error) {
		log.warning(`Could not load agent history: ${error}`);
	}
	return [];
}

export function saveHistory(history: string[]): void {
	try {
		if (!fs.existsSync(CACHE_DIR)) {
			fs.mkdirSync(CACHE_DIR, { recursive: true });
		}
		// Limit history size if needed before saving
		const limitedHistory = history.slice(-100); // Example: Keep last 100
		fs.writeFileSync(
			AGENT_HISTORY_PATH,
			limitedHistory.join("\n"),
			"utf-8",
		);
	} catch (error) {
		log.warning(`Could not save agent history: ${error}`);
	}
}
