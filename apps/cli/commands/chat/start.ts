import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { select, isCancel, cancel } from "@clack/prompts";
import { Config } from "@/utils/types";
import { logEvent } from "@/utils/logger";
import { CONFIG_PATH } from "@/utils/paths";
import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider, ModelName } from "@/utils/models";
import createChatInterface from "@/interface/chat-window";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

async function selectProvider(): Promise<Provider> {
	const provider = await select<Provider>({
		message: "Select a provider:",
		options: providers.map((p) => ({
			value: p,
			label: getProviderColor(p)(p),
		})),
	});
	handleCancel(provider);
	return provider as Provider;
}

async function selectModel(provider: Provider): Promise<ModelName> {
	const model = await select<ModelName>({
		message: `Select model from ${getProviderColor(provider)(provider)}:`,
		// @ts-ignore
		options: models[provider].map((m) => ({
			value: m,
			label: modelColor(m),
		})),
	});
	handleCancel(model);
	return model as ModelName;
}

async function startChat() {
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

		const providerArg = process.argv[2];
		const useTemp = process.argv.includes("--temp");

		// If provider specified
		if (providerArg) {
			const provider = providerArg as Provider;

			// If --temp flag is used, go directly to model selection
			if (useTemp) {
				const selectedModel = await selectModel(provider);
				if (!selectedModel) {
					console.log(chalk.yellow("\nChat session cancelled."));
					process.exit(0);
				}

				logEvent(
					"info",
					`Starting temporary chat session with ${selectedModel} from ${provider}`,
				);
				console.log(
					chalk.cyan(
						`\nStarting chat session with ${modelColor(
							selectedModel,
						)} ` +
							`from ${getProviderColor(provider)(provider)}...\n`,
					),
				);
				createChatInterface({
					model: selectedModel,
					provider: provider,
				});
				return;
			}

			// Check provider's default model
			const providerConfig = config[provider];
			if (providerConfig?.DEFAULT_MODEL) {
				logEvent(
					"info",
					`Starting chat session with ${providerConfig.DEFAULT_MODEL} from ${provider}`,
				);
				console.log(
					chalk.cyan(
						`\nStarting chat session with ${modelColor(
							providerConfig.DEFAULT_MODEL,
						)} ` +
							`from ${getProviderColor(provider)(provider)}...\n`,
					),
				);
				createChatInterface({
					model: providerConfig.DEFAULT_MODEL,
					provider: provider,
				});
				return;
			}
		}

		// If no provider specified, check global default
		if (
			!providerArg &&
			config.user.defaultModel &&
			config.user.defaultProvider &&
			!useTemp
		) {
			logEvent(
				"info",
				`Starting chat session with default model ${config.user.defaultModel} from ${config.user.defaultProvider}`,
			);
			console.log(
				chalk.cyan(
					`\nStarting chat session with ${modelColor(
						config.user.defaultModel,
					)} ` +
						`from ${getProviderColor(config.user.defaultProvider)(
							config.user.defaultProvider,
						)}...\n`,
				),
			);
			createChatInterface({
				model: config.user.defaultModel,
				provider: config.user.defaultProvider,
			});
			return;
		}

		// If no defaults or using temp mode, prompt for selection
		console.log(chalk.yellow("\nNo default model configured."));

		const option = await select<"default" | "temporary">({
			message: "How would you like to proceed?",
			options: [
				{
					label: "Set default model for future sessions",
					value: "default",
				},
				{
					label: "Use temporary model for this session",
					value: "temporary",
				},
			],
		});

		handleCancel(option);

		// Provider selection
		const selectedProvider =
			(providerArg as Provider) || (await selectProvider());
		// No need for null check here as handleCancel exits

		// Model selection
		const selectedModel = await selectModel(selectedProvider);
		// No need for null check here as handleCancel exits

		// Set as default if chosen
		if (option === "default") {
			config.user.defaultModel = selectedModel;
			config.user.defaultProvider = selectedProvider;
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
			logEvent(
				"info",
				`User set default chat model to ${selectedModel} from provider ${selectedProvider}`,
			);
			console.log(
				chalk.green("\nDefault model configured successfully!"),
			);
		}

		logEvent(
			"info",
			`Starting chat session with ${selectedModel} from ${selectedProvider}`,
		);
		console.log(
			chalk.cyan(
				`\nStarting chat session with ${modelColor(selectedModel)} ` +
					`from ${getProviderColor(selectedProvider)(
						selectedProvider,
					)}...\n`,
			),
		);

		createChatInterface({
			model: selectedModel,
			provider: selectedProvider,
		});
	} catch (error) {
		console.error(chalk.red("Error starting chat:"), error);
		process.exit(1);
	}
}

startChat().catch((error) => {
	console.error(chalk.red("Error in chat startup:"), error);
	process.exit(1);
});
