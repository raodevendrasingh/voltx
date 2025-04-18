import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { Config } from "@/utils/types";
import { CONFIG_PATH } from "@/utils/paths";
import { Provider, providers } from "@/utils/models";
import { getProviderColor, modelColor } from "@/utils/colors";

export default async function showDefaults() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'voltx init' first.\n",
				),
			);
			process.exit(1);
		}

		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;

		console.log(chalk.bold("\nDefault Configurations:\n"));

		// Show global defaults
		console.log(chalk.bold("Global Defaults:"));
		if (config.user.defaultModel && config.user.defaultProvider) {
			console.log(
				`${chalk.gray("→")} Default Model: ${modelColor(
					config.user.defaultModel,
				)} ` +
					`from ${getProviderColor(config.user.defaultProvider)(
						config.user.defaultProvider,
					)}`,
			);
		} else {
			console.log(chalk.yellow("No global defaults configured"));
		}

		// Show provider-specific defaults
		console.log(chalk.bold("\nProvider Defaults:"));
		providers.forEach((provider: Provider) => {
			const providerConfig = config[provider];
			console.log(`\n${getProviderColor(provider)(provider)}:`);

			if (providerConfig?.DEFAULT_MODEL) {
				console.log(
					`${chalk.gray("→")} Default Model: ${modelColor(
						providerConfig.DEFAULT_MODEL,
					)}`,
				);
			} else {
				console.log(chalk.yellow("No defaults configured"));
			}
		});

		console.log(); // Empty line at end
	} catch (error) {
		console.error(chalk.red("Error showing defaults:"), error);
		process.exit(1);
	}
}
