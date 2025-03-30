import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types.ts";
import { logEvent } from "@/utils/logger.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { models, providers, Provider, ModelName } from "@/utils/models.ts";
import createChatInterface from "@/interface/chat-window.tsx";

async function selectProvider(): Promise<Provider | null> {
	const { provider } = await inquirer.prompt([
		{
			type: "list",
			name: "provider",
			message: "Select a provider:",
			choices: [
				...providers.map((p) => ({
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

async function selectModel(provider: Provider): Promise<ModelName | null> {
	const { model } = await inquirer.prompt([
		{
			type: "list",
			name: "model",
			message: `Select model from ${getProviderColor(provider)(
				provider
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

async function startChat() {
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
					`Starting temporary chat session with ${selectedModel} from ${provider}`
				);
				console.log(
					chalk.cyan(
						`\nStarting chat session with ${modelColor(
							selectedModel
						)} ` +
							`from ${getProviderColor(provider)(provider)}...\n`
					)
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
					`Starting chat session with ${providerConfig.DEFAULT_MODEL} from ${provider}`
				);
				console.log(
					chalk.cyan(
						`\nStarting chat session with ${modelColor(
							providerConfig.DEFAULT_MODEL
						)} ` +
							`from ${getProviderColor(provider)(provider)}...\n`
					)
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
				`Starting chat session with default model ${config.user.defaultModel} from ${config.user.defaultProvider}`
			);
			console.log(
				chalk.cyan(
					`\nStarting chat session with ${modelColor(
						config.user.defaultModel
					)} ` +
						`from ${getProviderColor(config.user.defaultProvider)(
							config.user.defaultProvider
						)}...\n`
				)
			);
			createChatInterface({
				model: config.user.defaultModel,
				provider: config.user.defaultProvider,
			});
			return;
		}

		// If no defaults or using temp mode, prompt for selection
		console.log(chalk.yellow("\nNo default model configured."));

		const { option } = await inquirer.prompt([
			{
				type: "list",
				name: "option",
				message: "How would you like to proceed?",
				choices: [
					{
						name: "Set default model for future sessions",
						value: "default",
					},
					{
						name: "Use temporary model for this session",
						value: "temporary",
					},
				],
			},
		]);

		// Provider selection
		const selectedProvider =
			(providerArg as Provider) || (await selectProvider());
		if (!selectedProvider) {
			console.log(chalk.yellow("\nChat session cancelled."));
			process.exit(0);
		}

		// Model selection
		const selectedModel = await selectModel(selectedProvider);
		if (!selectedModel) {
			console.log(chalk.yellow("\nChat session cancelled."));
			process.exit(0);
		}

		// Set as default if chosen
		if (option === "default") {
			config.user.defaultModel = selectedModel;
			config.user.defaultProvider = selectedProvider;
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
			logEvent(
				"info",
				`User set default chat model to ${selectedModel} from provider ${selectedProvider}`
			);
			console.log(
				chalk.green("\nDefault model configured successfully!")
			);
		}

		logEvent(
			"info",
			`Starting chat session with ${selectedModel} from ${selectedProvider}`
		);
		console.log(
			chalk.cyan(
				`\nStarting chat session with ${modelColor(selectedModel)} ` +
					`from ${getProviderColor(selectedProvider)(
						selectedProvider
					)}...\n`
			)
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
