import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import {
	BASE_DIR,
	CONFIG_PATH,
	LOGS_DIR,
	CHATS_DIR,
	TEMP_DIR,
	CACHE_DIR,
} from "@/utils/paths";
import { models, providers, Provider, ModelName } from "@/utils/models";
import { getProviderColor, modelColor } from "@/utils/colors";
import { logEvent } from "@/utils/logger";
import { Config } from "@/utils/types";
import { showBanner } from "@/utils/ascii";
import {
	intro,
	outro,
	select,
	text,
	confirm,
	isCancel,
	cancel,
} from "@clack/prompts";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

const createDirectories = () => {
	[BASE_DIR, LOGS_DIR, CHATS_DIR, TEMP_DIR, CACHE_DIR].forEach((dir) => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	});
};

const askUsername = async (): Promise<string> => {
	const username = await text({
		message: "What should we call you?",
		placeholder: "Enter your alias",
		validate(value) {
			if (!value) return "Username is required";
			if (!/^[a-z0-9]+$/.test(value))
				return "Username must contain only lowercase letters and numbers";
		},
	});
	handleCancel(username);
	return username as string;
};

const selectProvider = async (
	configuredProviders: Provider[] = [],
): Promise<Provider | null> => {
	const availableProviders = providers.filter(
		(p) => !configuredProviders.includes(p),
	);

	if (availableProviders.length === 0) {
		console.log(chalk.yellow("\nAll providers have been configured."));
		return null;
	}

	const provider = await select({
		message: "Select a provider to configure:",
		options: availableProviders.map((p) => ({
			value: p,
			label: getProviderColor(p)(p),
		})),
	});

	handleCancel(provider);
	return provider as Provider;
};

const selectModel = async (provider: Provider): Promise<ModelName> => {
	const providerModels = models[provider];

	const model = await select<ModelName>({
		message: `Select default model for ${getProviderColor(provider)(
			provider,
		)}:`,
		// @ts-ignore
		options: providerModels.map((m) => ({
			value: m,
			label: modelColor(m),
		})),
	});

	handleCancel(model);

	return model as ModelName;
};

const configureProvider = async (
	provider: Provider,
): Promise<{
	API_KEY: string;
	DEFAULT_MODEL: ModelName;
}> => {
	const apiKey = await text({
		message: `Enter API key for ${getProviderColor(provider)(provider)}:`,
		validate: (input: string) => {
			if (input.trim() === "") {
				return "API key is required";
			}
		},
	});

	handleCancel(apiKey);

	const defaultModel = await selectModel(provider);

	return {
		API_KEY: apiKey as string,
		DEFAULT_MODEL: defaultModel,
	};
};

const askToContinue = async (): Promise<boolean> => {
	const shouldContinue = await confirm({
		message: "Would you like to configure another provider?",
		initialValue: false,
	});

	handleCancel(shouldContinue);
	return shouldContinue as boolean;
};

export async function init() {
	createDirectories();
	showBanner();

	if (fs.existsSync(CONFIG_PATH)) {
		console.log(
			chalk.gray(
				"\nConfiguration already exists, skipping initialization.",
			),
		);
		console.log(chalk.gray('For help, run "voltx help"\n'));
		process.exit(0);
	}

	intro(`Welcome to Voltx! Let's get you set up.`);

	const username = await askUsername();
	const timestamp = new Date().toISOString();

	const config: Config = {
		user: {
			username,
			createdAt: timestamp,
			providers: [],
			defaultModel: null,
			defaultProvider: null,
		},
	};

	logEvent("info", `User initialized voltx with alias: ${username}`);

	let shouldContinue = true;
	while (shouldContinue) {
		const provider = await selectProvider(config.user.providers);
		if (!provider) break;

		const providerConfig = await configureProvider(provider);
		config[provider] = providerConfig;
		config.user.providers.push(provider);

		if (config.user.providers.length === 1) {
			config.user.defaultProvider = provider;
			config.user.defaultModel = providerConfig.DEFAULT_MODEL;
		}

		logEvent(
			"info",
			`User ${username} configured provider: ${provider} with model: ${providerConfig.DEFAULT_MODEL}`,
		);

		shouldContinue = await askToContinue();
	}

	fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
	outro(chalk.green("Configuration completed successfully! 🎉"));
}
