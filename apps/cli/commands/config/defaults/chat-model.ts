import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import config from "@/utils/load-config";
import { select, confirm, text, isCancel, cancel, log } from "@clack/prompts";
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

async function selectModel(provider: Provider): Promise<ModelName | null> {
	type ModelSelectOption =
		| { value: ModelName; label: string }
		| { value: null; label: string };

	const options: ModelSelectOption[] = [
		...models[provider].map((m) => ({
			label: modelColor(m),
			value: m,
		})),
		{ label: "Exit", value: null },
	];

	const model = await select<ModelName | null>({
		message: `Select default model from ${getProviderColor(provider)(
			provider,
		)}:`,
		// @ts-ignore
		options: options,
	});
	handleCancel(model);
	return model as ModelName;
}

async function configureProvider(provider: Provider): Promise<{
	API_KEY: string;
	DEFAULT_MODEL: ModelName;
} | null> {
	const shouldConfigure = await confirm({
		message: `Would you like to configure ${getProviderColor(provider)(
			provider,
		)}?`,
		initialValue: false,
	});

	handleCancel(shouldConfigure);

	if (!shouldConfigure) {
		log.warn(chalk.yellow("Skipping default model configuration."));
		return null;
	}

	const apiKey = await text({
		message: `Enter API key for ${getProviderColor(provider)(provider)}:`,
		validate: (input: string) => {
			if (input.trim() === "") {
				return "API key is required";
			}
		},
	});

	handleCancel(apiKey);

	const model = await selectModel(provider);
	if (!model) {
		log.warn(chalk.yellow("\nExiting without setting default model."));
		return null;
	}

	return {
		API_KEY: apiKey as string,
		DEFAULT_MODEL: model,
	};
}

export async function setDefaultChatModel(providerName: string | null) {
	try {
		if (!providerName || !providers.includes(providerName as Provider)) {
			console.error(
				chalk.red("\nError: Invalid or missing provider\n") +
					chalk.gray("Available providers: ") +
					providers.map((p) => getProviderColor(p)(p)).join(", ") +
					"\n",
			);
			process.exit(1);
		}

		if (!fs.existsSync(CONFIG_PATH)) {
			log.warn(
				chalk.yellow("Voltx not initialized.") +
					" Run " +
					chalk.cyan("`voltx init`") +
					" to set it up.",
			);
			process.exit(0);
		}

		// Check if provider is configured
		if (!config.user.providers.includes(providerName as Provider)) {
			log.warn(
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

			log.success(
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
			log.error(
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
			log.warn(chalk.yellow("Exiting without setting default model."));
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

		log.success(
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
