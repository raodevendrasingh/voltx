import TOML from "@iarna/toml";
import { readFileSync } from "fs";
import { CONFIG_PATH } from "./paths";
import { VoltxConfig } from "./types";
import { log } from "@clack/prompts";
import chalk from "chalk";

export default function config(): VoltxConfig {
	try {
		const rawToml = readFileSync(CONFIG_PATH, "utf-8");
		const parsedConfig = TOML.parse(rawToml);
		return parsedConfig as unknown as VoltxConfig;
	} catch (error: any) {
		if (error.code === "ENOENT") {
			// Check if the command is 'init' before showing the warning
			const isInitCommand = process.argv.slice(2)[0] === "init";

			if (!isInitCommand) {
				log.warn(
					chalk.yellow("Voltx not initialized.") +
						" Run " +
						chalk.cyan("`voltx init`") +
						" to set it up.",
				);
				console.log();
				process.exit(0);
			}

			// Return an empty config object when init is running
			return {
				user: {
					alias: "",
					createdAt: "",
					providers: [],
					defaultModel: null,
					defaultProvider: null,
				},
			} as VoltxConfig;
		} else {
			log.error(
				chalk.red("Error loading Voltx config:") + " " + error.message,
			);
			process.exit(1);
		}
	}
}
