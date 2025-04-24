import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import config from "@/utils/load-config";
import { CONFIG_PATH } from "@/utils/paths";
import { Provider } from "@/utils/models";
import { logEvent } from "@/utils/logger";
import { log } from "@clack/prompts";

export async function resetDefaults(hardFlag: boolean) {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			log.warn(
				chalk.yellow("Voltx not initialized.") +
					" Run " +
					chalk.cyan("`voltx init`") +
					" to set it up.",
			);
			process.exit(0);
		}

		if (!hardFlag) {
			log.warn(
				`${chalk.red.bold(
					"Warning:",
				)} This command will reset all configured default models:\n` +
					"- Global default model and provider\n" +
					"- Provider-specific default models\n\n" +
					`If you're sure, run with the ${chalk.bold(
						"--hard",
					)} flag.\n`,
			);
			process.exit(0);
		}

		// Reset global defaults
		config.user.defaultModel = null;
		config.user.defaultProvider = null;

		// Reset provider-specific defaults
		config.user.providers.forEach((provider: Provider) => {
			if (config[provider]) {
				config[provider].DEFAULT_MODEL = "";
			}
		});

		// Save updated config
		fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

		logEvent("info", "User reset all default model configurations");

		log.success(
			chalk.green(
				"All default model configurations have been reset successfully!\n",
			),
		);
	} catch (error) {
		console.error(chalk.red("Error resetting defaults:"), error);
		process.exit(1);
	}
}
