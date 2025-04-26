import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import {
	select,
	text,
	isCancel,
	cancel,
	outro,
	intro,
	log,
} from "@clack/prompts";
import loadConfig from "@/utils/load-config";
import { ProviderConfig } from "@/utils/types";
import { CONFIG_PATH } from "@/utils/paths";
import { models, providers, Provider, ModelName } from "@/utils/models";
import { getProviderColor, modelColor } from "@/utils/colors";
import { logEvent } from "@/utils/logger";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

async function selectProvider(
	unconfiguredProviders: Provider[],
): Promise<Provider | null> {
	if (unconfiguredProviders.length === 0) {
		log.success(chalk.yellow("\nAll providers have been configured."));
		return null;
	}

	const provider = await select<Provider | null>({
		message: "Select a provider to configure:",
		options: [
			...unconfiguredProviders.map((p) => ({
				label: getProviderColor(p)(p),
				value: p,
			})),
			{ label: "Exit", value: null },
		],
	});

	handleCancel(provider);
	return provider as Provider;
}

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

			providerToConfig = await selectProvider(unconfiguredProviders);
			if (!providerToConfig) {
				process.exit(0);
			}
		}

		const currentConfig =
			(config[providerToConfig] as ProviderConfig) || {};

		// Only ask for API key if it's missing
		let apiKey = currentConfig.API_KEY;
		if (!apiKey || apiKey.trim() === "") {
			const newApiKey = await text({
				message: `Enter API key for ${getProviderColor(
					providerToConfig,
				)(providerToConfig)}:`,
				validate: (input: string) => {
					if (input.trim() === "") {
						return "API key is required";
					}
				},
			});
			handleCancel(newApiKey);
			apiKey = newApiKey as string;
		}

		// Only ask for model if it's missing
		let defaultModel = currentConfig.DEFAULT_MODEL;
		if (!defaultModel || defaultModel.trim() === "") {
			const model = await select<ModelName>({
				message: `Select default model for ${getProviderColor(
					providerToConfig,
				)(providerToConfig)}:`,
				// @ts-ignore
				options: models[providerToConfig].map((m) => ({
					value: m,
					label: modelColor(m),
				})),
			});
			handleCancel(model);
			defaultModel = model as string;
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
