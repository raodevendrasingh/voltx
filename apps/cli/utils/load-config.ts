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
			log.warn(
				chalk.yellow("Voltx not initialized.") +
					" Run " +
					chalk.cyan("`voltx init`") +
					" to set it up.",
			);
			console.log();
			process.exit(0);
		} else {
			log.error(
				chalk.red("Error loading Voltx config:") + " " + error.message,
			);
			process.exit(1);
		}
	}
}
