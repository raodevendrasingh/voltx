import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { Config } from "@/utils/types";
import { CONFIG_PATH } from "@/utils/paths";
import { Provider } from "@/utils/models";
import { logEvent } from "@/utils/logger";

export async function resetDefaults(hardFlag: boolean) {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'voltx init' first.\n",
				),
			);
			process.exit(1);
		}

		if (!hardFlag) {
			console.log(
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

		// Read current config
		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;

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

		console.log(
			chalk.green(
				"\nAll default model configurations have been reset successfully!\n",
			),
		);
	} catch (error) {
		console.error(chalk.red("Error resetting defaults:"), error);
		process.exit(1);
	}
}
