import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { Config } from "@/utils/types.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { Provider } from "@/utils/models.ts";
import { logEvent } from "@/utils/logger.ts";

async function resetDefaults() {
	try {
		const args = process.argv.slice(2);
		const hardFlag = args.includes("--hard");

		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'system init' first.\n"
				)
			);
			process.exit(1);
		}

		if (!hardFlag) {
			console.log(
				`${chalk.red.bold(
					"Warning:"
				)} This command will reset all configured default models:\n` +
					"- Global default model and provider\n" +
					"- Provider-specific default models\n\n" +
					`If you're sure, run with the ${chalk.bold(
						"--hard"
					)} flag.\n`
			);
			process.exit(0);
		}

		// Read current config
		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;

		// Reset global defaults
		config.user.defaultModel = "";
		config.user.defaultProvider = "";

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
				"\nAll default model configurations have been reset successfully!\n"
			)
		);
	} catch (error) {
		console.error(chalk.red("Error resetting defaults:"), error);
		process.exit(1);
	}
}

resetDefaults().catch((error) => {
	console.error(chalk.red("Error:"), error);
	process.exit(1);
});
