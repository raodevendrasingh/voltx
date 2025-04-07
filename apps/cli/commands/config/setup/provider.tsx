import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { models, providers, Provider } from "@/utils/models.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { logEvent } from "@/utils/logger.ts";

async function selectProvider(
	unconfiguredProviders: Provider[]
): Promise<Provider | null> {
	if (unconfiguredProviders.length === 0) {
		console.log(chalk.yellow("\nAll providers have been configured."));
		return null;
	}

	const { provider } = await inquirer.prompt([
		{
			type: "list",
			name: "provider",
			message: "Select a provider to configure:",
			choices: [
				...unconfiguredProviders.map((p) => ({
					name: getProviderColor(p)(p),
					value: p,
				})),
				new inquirer.Separator(),
				{ name: "Exit", value: null },
			],
		},
	]);
	return provider;
}

async function configureProvider() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'voltx init' first.\n"
				)
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
						"\n"
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
						`\nProvider "${providerArg}" is already fully configured.`
					) +
						"\nAvailable unconfigured providers: " +
						unconfiguredProviders
							.map((p) => getProviderColor(p)(p))
							.join(", ") +
						"\n"
				);
				process.exit(0);
			}

			providerToConfig = providerArg as Provider;
		} else {
			// Interactive provider selection
			providerToConfig = await selectProvider(unconfiguredProviders);
			if (!providerToConfig) {
				console.log(chalk.yellow("\nConfiguration cancelled."));
				process.exit(0);
			}
		}

		// Get current provider config
		const currentConfig = config[providerToConfig] || {};

		// Only ask for API key if it's missing
		let apiKey = currentConfig.API_KEY;
		if (!apiKey || apiKey.trim() === "") {
			const { newApiKey } = await inquirer.prompt([
				{
					type: "input",
					name: "newApiKey",
					message: `Enter API key for ${getProviderColor(
						providerToConfig
					)(providerToConfig)}:`,
					validate: (input: string) =>
						input.trim() !== "" || "API key is required",
				},
			]);
			apiKey = newApiKey;
		}

		// Only ask for model if it's missing
		let defaultModel = currentConfig.DEFAULT_MODEL;
		if (!defaultModel || defaultModel.trim() === "") {
			const { model } = await inquirer.prompt([
				{
					type: "list",
					name: "model",
					message: `Select default model for ${getProviderColor(
						providerToConfig
					)(providerToConfig)}:`,
					choices: models[providerToConfig].map((m) => ({
						name: modelColor(m),
						value: m,
					})),
				},
			]);
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
			`User ${config.user.username} updated provider: ${providerToConfig}`
		);

		console.log(
			chalk.green(
				`\nSuccess! Provider ${getProviderColor(providerToConfig)(
					providerToConfig
				)} configured with model ${modelColor(defaultModel)}\n`
			)
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
