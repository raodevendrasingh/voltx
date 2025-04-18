import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { select, text, isCancel, cancel } from "@clack/prompts";
import { Config } from "@/utils/types";
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
		console.log(chalk.yellow("\nAll providers have been configured."));
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

async function configureProvider() {
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

		// Modified: Get unconfigured providers with reason
		const unconfiguredProviders = providers.filter((p) => {
			const providerConfig = config[p];
			return (
				!config.user.providers.includes(p) ||
				!providerConfig?.API_KEY ||
				providerConfig.API_KEY.trim() === "" ||
				!providerConfig?.DEFAULT_MODEL ||
				providerConfig.DEFAULT_MODEL.trim() === ""
			);
		});

		// Check for provider flag (--provider=name)
		const providerArg = process.argv
			.find((arg) => arg.startsWith("--"))
			?.slice(2);

		let providerToConfig: Provider | null = null;

		if (providerArg) {
			// Handle --provider flag case
			if (!providers.includes(providerArg as Provider)) {
				console.error(
					chalk.red("\nError: Unknown provider\n") +
						chalk.gray("Available unconfigured providers: ") +
						unconfiguredProviders
							.map((p) => getProviderColor(p)(p))
							.join(", ") +
						"\n",
				);
				process.exit(1);
			}

			// Modified: Check if provider is properly configured
			const providerConfig = config[providerArg];
			const isFullyConfigured =
				config.user.providers.includes(providerArg as Provider) &&
				providerConfig?.API_KEY &&
				providerConfig?.DEFAULT_MODEL &&
				providerConfig.API_KEY.trim() !== "" &&
				providerConfig.DEFAULT_MODEL.trim() !== "";

			if (isFullyConfigured) {
				console.log(
					chalk.yellow(
						`\nProvider "${providerArg}" is already fully configured.`,
					) +
						"\nAvailable unconfigured providers: " +
						unconfiguredProviders
							.map((p) => getProviderColor(p)(p))
							.join(", ") +
						"\n",
				);
				process.exit(0);
			}

			providerToConfig = providerArg as Provider;
		} else {
			// Interactive provider selection
			providerToConfig = await selectProvider(unconfiguredProviders);
			if (!providerToConfig) {
				// Exit handled by selectProvider if null is chosen
				process.exit(0);
			}
		}

		// Get current provider config
		const currentConfig = config[providerToConfig] || {};

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
			defaultModel = model;
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
			`User ${config.user.username} updated provider: ${providerToConfig}`,
		);

		console.log(
			chalk.green(
				`\nSuccess! Provider ${getProviderColor(providerToConfig)(
					providerToConfig,
				)} configured with model ${modelColor(defaultModel)}\n`,
			),
		);
	} catch (error) {
		console.error(chalk.red("Error during provider configuration:"), error);
		process.exit(1);
	}
}

configureProvider().catch((error) => {
	console.error(chalk.red("Error during provider configuration:"), error);
	process.exit(1);
});
