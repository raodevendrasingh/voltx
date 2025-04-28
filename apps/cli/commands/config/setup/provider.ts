import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { outro, intro, log } from "@clack/prompts";
import loadConfig from "@/lib/load-config";
import { ProviderConfig } from "@/utils/types";
import { CONFIG_PATH } from "@/utils/paths";
import { providers, Provider } from "@/utils/models";
import { getProviderColor, modelColor } from "@/utils/colors";
import { logEvent } from "@/lib/logger";
import { askApiKey, selectModel, selectProvider } from "@/lib/prompts";

export async function configureProvider(providerName?: Provider) {
	try {
		const config = loadConfig();

		// Get unconfigured providers with reason
		const unconfiguredProviders = providers.filter((p) => {
			const providerConfig = config[p] as ProviderConfig;
			return (
				!config.user.providers.includes(p) ||
				!providerConfig?.API_KEY ||
				providerConfig.API_KEY.trim() === "" ||
				!providerConfig?.DEFAULT_MODEL ||
				providerConfig.DEFAULT_MODEL.trim() === ""
			);
		});

		let providerToConfig: Provider | null = null;

		// Use the passed providerName directly
		if (providerName) {
			console.log("");
			intro(
				chalk.whiteBright(
					`Let's set up your ${getProviderColor(providerName)(
						providerName,
					)} configuration!`,
				),
			);

			const providerConfig = config[providerName] as ProviderConfig;
			const isFullyConfigured =
				config.user.providers.includes(providerName) &&
				providerConfig?.API_KEY &&
				providerConfig?.DEFAULT_MODEL &&
				providerConfig.API_KEY.trim() !== "" &&
				providerConfig.DEFAULT_MODEL.trim() !== "";

			if (isFullyConfigured) {
				log.info(
					chalk.yellow(
						`\nProvider "${getProviderColor(providerName)(
							providerName,
						)}" is already fully configured.`,
					) +
						"\nAvailable unconfigured providers: " +
						unconfiguredProviders
							.map((p) => getProviderColor(p)(p))
							.join(", ") +
						"\n",
				);
				process.exit(0);
			}

			providerToConfig = providerName;
		} else {
			console.log("");
			intro(
				chalk.whiteBright(`Let's set up your provider configuration!`),
			);

			// Pass the unconfiguredProviders list to selectProvider
			providerToConfig = await selectProvider(unconfiguredProviders);
			if (!providerToConfig) {
				// Add an exit option or handle null return appropriately
				log.info("No provider selected. Exiting configuration.");
				process.exit(0);
			}
		}

		const currentConfig =
			(config[providerToConfig] as ProviderConfig) || {};

		// Only ask for API key if it's missing
		let apiKey = currentConfig.API_KEY;
		if (!apiKey || apiKey.trim() === "") {
			// Use imported askApiKey
			apiKey = await askApiKey(providerToConfig);
		}

		// Only ask for model if it's missing
		let defaultModel = currentConfig.DEFAULT_MODEL;
		if (!defaultModel || defaultModel.trim() === "") {
			// Use imported selectModel
			defaultModel = await selectModel(providerToConfig);
		}

		// Update configuration preserving existing values
		config[providerToConfig] = {
			...currentConfig,
			API_KEY: apiKey,
			DEFAULT_MODEL: defaultModel,
		};

		if (!config.user.providers.includes(providerToConfig)) {
			config.user.providers.push(providerToConfig);
		}

		fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

		logEvent(
			"info",
			`User ${config.user.alias} updated provider: ${providerToConfig}`,
		);

		outro(
			chalk.green(
				`Success! Provider ${getProviderColor(providerToConfig)(
					providerToConfig,
				)} configured with model ${modelColor(defaultModel)}\n`,
			),
		);
	} catch (error) {
		console.error(chalk.red("Error during provider configuration:"), error);
		process.exit(1);
	}
}
