import fs from "fs";
import path from "path";
import chalk from "chalk";
import { LOGS_DIR } from "@/utils/paths";
import { log } from "@clack/prompts";

export const logEvent = (level: "info" | "warn" | "error", message: string) => {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;

	if (!fs.existsSync(LOGS_DIR)) {
		fs.mkdirSync(LOGS_DIR, { recursive: true });
	}

	const logFile = path.join(
		LOGS_DIR,
		`logs_${new Date().toISOString().slice(0, 10)}`,
	);
	fs.appendFileSync(logFile, logMessage);

	if (level === "error") {
		log.error(chalk.red(logMessage.trim()));
	}
};
