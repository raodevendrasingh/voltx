import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types";
import { CONFIG_PATH } from "@/utils/paths";
import { models, providers, Provider, ModelName } from "@/utils/models";
import { getProviderColor, modelColor } from "@/utils/colors";
import { logEvent } from "@/utils/logger";

async function selectModel(provider: Provider): Promise<ModelName | null> {
	const { model } = await inquirer.prompt([
		{
			type: "list",
			name: "model",
			message: `Select default model from ${getProviderColor(provider)(
				provider,
			)}:`,
			choices: [
				...models[provider].map((m) => ({
					name: modelColor(m),
					value: m,
				})),
				new inquirer.Separator(),
				{ name: "Exit", value: null },
			],
		},
	]);
	return model;
}

async function configureProvider(provider: Provider): Promise<{
	API_KEY: string;
	DEFAULT_MODEL: ModelName;
} | null> {
	const { configure } = await inquirer.prompt([
		{
			type: "confirm",
			name: "configure",
			message: `Would you like to configure ${getProviderColor(provider)(
				provider,
			)}?`,
			default: false,
		},
	]);

	if (!configure) {
		console.log(chalk.yellow("\nSkipping default model configuration."));
		return null;
	}

	const { apiKey } = await inquirer.prompt([
		{
			type: "input",
			name: "apiKey",
			message: `Enter API key for ${getProviderColor(provider)(
				provider,
			)}:`,
			validate: (input: string) =>
				input.trim() !== "" || "API key is required",
		},
	]);

	const model = await selectModel(provider);
	if (!model) {
		console.log(chalk.yellow("\nExiting without setting default model."));
		return null;
	}

	return {
		API_KEY: apiKey,
		DEFAULT_MODEL: model,
	};
}

async function setDefaultModel() {
	try {
		const providerName = process.argv[2];

		if (!providers.includes(providerName as Provider)) {
			console.error(
				chalk.red("\nError: Invalid provider\n") +
					chalk.gray("Available providers: ") +
					providers.map((p) => getProviderColor(p)(p)).join(", ") +
					"\n",
			);
			process.exit(1);
		}

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

		// Check if provider is configured
		if (!config.user.providers.includes(providerName as Provider)) {
			console.log(
				chalk.yellow(
					`\nProvider ${getProviderColor(providerName as Provider)(
						providerName,
					)} is not configured.`,
				),
			);

			const providerConfig = await configureProvider(
				providerName as Provider,
			);
			if (!providerConfig) {
				process.exit(0);
			}

			// Set provider configuration
			config[providerName] = providerConfig;
			config.user.providers.push(providerName as Provider);
			config.user.defaultModel = providerConfig.DEFAULT_MODEL;
			config.user.defaultProvider = providerName as Provider;

			// Save configuration
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

			logEvent(
				"info",
				`User configured provider ${providerName} and set default model: ${providerConfig.DEFAULT_MODEL}`,
			);

			console.log(
				chalk.green(
					`\nSuccess! Provider ${getProviderColor(
						providerName as Provider,
					)(
						providerName,
					)} configured and default model set to ${modelColor(
						providerConfig.DEFAULT_MODEL,
					)}\n`,
				),
			);
			process.exit(0);
		}

		// Check if provider has API key
		if (!config[providerName]?.API_KEY) {
			console.log(
				chalk.yellow(
					`\nProvider ${getProviderColor(providerName as Provider)(
						providerName,
					)} is missing API key configuration.`,
				),
			);
			process.exit(1);
		}

		// Select model for configured provider
		const model = await selectModel(providerName as Provider);
		if (!model) {
			console.log(
				chalk.yellow("\nExiting without setting default model."),
			);
			process.exit(0);
		}

		// Set model both globally and at provider level
		config.user.defaultModel = model;
		config.user.defaultProvider = providerName as Provider;
		config[providerName].DEFAULT_MODEL = model; // Set at provider level

		fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

		logEvent(
			"info",
			`User configured default model: ${model} from provider ${providerName}`,
		);

		console.log(
			chalk.green(
				`\nDefault model configured successfully: ${modelColor(
					model,
				)} ` +
					`from ${getProviderColor(providerName as Provider)(
						providerName,
					)}\n`,
			),
		);
	} catch (error) {
		console.error(chalk.red("Error setting default model:"), error);
		process.exit(1);
	}
}

setDefaultModel().catch((error) => {
	console.error(chalk.red("Error:"), error);
	process.exit(1);
});
