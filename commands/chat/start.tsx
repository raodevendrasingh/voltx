import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types.ts";
import { logEvent } from "@/utils/logger.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { models, providers, Provider, ModelName } from "@/utils/models.ts";

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

async function selectModel(
	provider: Provider
): Promise<ModelName | null | "back"> {
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
				{ name: "Back to provider selection", value: "back" },
				{ name: "Exit", value: null },
			],
		},
	]);
	return model === "back" ? "back" : model;
}

async function startChat() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'system init' first.\n"
				)
			);
			process.exit(1);
		}

		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;

		if (config.user.defaultModel && config.user.defaultProvider) {
			console.log(
				chalk.cyan(
					`\nStarting chat session with ${modelColor(
						config.user.defaultModel
					)} from ${getProviderColor(config.user.defaultProvider)(
						config.user.defaultProvider
					)}...\n`
				)
			);
			process.exit(0);
		}

		console.log(chalk.yellow("\nNo default model configured."));

		type ChatOption = "default" | "temporary";
		const { option } = await inquirer.prompt<{ option: ChatOption }>([
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

		let provider: Provider | null;
		let model: ModelName | null | "back";

		while (true) {
			provider = await selectProvider();
			if (!provider) {
				console.log(chalk.yellow("\nExiting chat session."));
				process.exit(0);
			}

			model = await selectModel(provider);
			if (!model) {
				console.log(chalk.yellow("\nExiting chat session."));
				process.exit(0);
			}
			if (model === "back") {
				continue;
			}
			break;
		}

		if (option === "default") {
			config.user.defaultModel = model;
			config.user.defaultProvider = provider;

			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

			logEvent(
				"info",
				`User set default chat model to ${model} from provider ${provider}`
			);

			console.log(
				chalk.green("\nDefault model configured successfully!")
			);
		}

		console.log(
			chalk.cyan(
				`\nStarting chat session with ${modelColor(
					model
				)} from ${getProviderColor(provider)(provider)}...\n`
			)
		);

		process.exit(0);
	} catch (error) {
		console.error(chalk.red("Error starting chat:"), error);
		process.exit(1);
	}
}

startChat().catch((error) => {
	console.error(chalk.red("Error in chat startup:"), error);
	process.exit(1);
});
