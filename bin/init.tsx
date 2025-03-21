#!/usr/bin/env node
import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import {
	BASE_DIR,
	CONFIG_PATH,
	LOGS_DIR,
	CHATS_DIR,
	TEMP_DIR,
	CACHE_DIR,
} from "@/utils/paths.ts";
import { models, providers, Provider, ModelName } from "@/utils/models.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { logEvent } from "@/utils/logger.ts";
import { Config } from "@/utils/types.ts";
import { showBanner } from "@/utils/ascii.ts";

const createDirectories = () => {
	[BASE_DIR, LOGS_DIR, CHATS_DIR, TEMP_DIR, CACHE_DIR].forEach((dir) => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	});
};

const validateUsername = (input: string): boolean | string => {
	if (!input) return "Username is required";
	if (!/^[a-z0-9]+$/.test(input))
		return "Username must contain only lowercase letters and numbers";
	return true;
};

const askUsername = async (): Promise<string> => {
	const { username } = await inquirer.prompt([
		{
			type: "input",
			name: "username",
			message: "What should we call you?",
			validate: validateUsername,
		},
	]);
	return username;
};

const selectProvider = async (
	configuredProviders: Provider[] = []
): Promise<Provider | null> => {
	const availableProviders = providers.filter(
		(p) => !configuredProviders.includes(p)
	);

	if (availableProviders.length === 0) {
		console.log(chalk.yellow("\nAll providers have been configured."));
		return null;
	}

	console.log(chalk.bold("\nAvailable Providers:"));
	const { provider } = await inquirer.prompt([
		{
			type: "list",
			name: "provider",
			message: "Select a provider to configure:",
			choices: availableProviders.map((p) => ({
				name: getProviderColor(p)(p),
				value: p,
			})),
		},
	]);
	return provider as Provider;
};

const selectModel = async (provider: Provider): Promise<ModelName> => {
	const providerModels = models[provider];
	const { model } = await inquirer.prompt([
		{
			type: "list",
			name: "model",
			message: `Select default model for ${getProviderColor(provider)(
				provider
			)}:`,
			choices: providerModels.map((m) => ({
				name: modelColor(m),
				value: m,
			})),
		},
	]);
	return model;
};

const configureProvider = async (
	provider: Provider
): Promise<{
	API_KEY: string;
	DEFAULT_MODEL: ModelName;
}> => {
	const { apiKey } = await inquirer.prompt([
		{
			type: "input",
			name: "apiKey",
			message: `Enter API key for ${getProviderColor(provider)(
				provider
			)}:`,
			validate: (input: string) =>
				input.trim() !== "" || "API key is required",
		},
	]);

	const defaultModel = await selectModel(provider);

	return {
		API_KEY: apiKey,
		DEFAULT_MODEL: defaultModel,
	};
};

const askToContinue = async (): Promise<boolean> => {
	const { continue: shouldContinue } = await inquirer.prompt([
		{
			type: "confirm",
			name: "continue",
			message: "Would you like to configure another provider?",
			default: false,
		},
	]);
	return shouldContinue;
};

const run = async () => {
	createDirectories();
	showBanner();

	if (fs.existsSync(CONFIG_PATH)) {
		console.log(
			chalk.gray(
				"\nConfiguration already exists, skipping initialization."
			)
		);
		console.log(chalk.gray('For help, run "system help"\n'));
		process.exit(0);
	}

	const username = await askUsername();
	const timestamp = new Date().toISOString();

	const config: Config = {
		user: {
			username,
			createdAt: timestamp,
			providers: [],
			defaultModel: "",
			defaultProvider: "",
		},
	};

	logEvent("info", `User initialized system with username: ${username}`);

	let shouldContinue = true;
	while (shouldContinue) {
		const provider = await selectProvider(config.user.providers);
		if (!provider) break;

		const providerConfig = await configureProvider(provider);
		config[provider] = providerConfig;
		config.user.providers.push(provider);

		logEvent(
			"info",
			`User ${username} configured provider: ${provider} with model: ${providerConfig.DEFAULT_MODEL}`
		);

		shouldContinue = await askToContinue();
	}

	fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
	console.log(chalk.green("\nConfiguration completed successfully! 🎉\n"));
};

run().catch((error) => {
	console.error(chalk.red("Error during initialization:"), error);
	process.exit(1);
});
