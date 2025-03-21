import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { models, providers, Provider, ModelName } from "@/utils/models.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { logEvent } from "@/utils/logger.ts";

async function selectModel(provider: Provider): Promise<ModelName | null> {
	const { model } = await inquirer.prompt([
		{
			type: "list",
			name: "model",
			message: `Select default model from ${getProviderColor(provider)(
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

async function setDefaultModel() {
	try {
		const providerName = process.argv[2];

		if (!providers.includes(providerName as Provider)) {
			console.error(
				chalk.red("\nError: Invalid provider\n") +
					chalk.gray("Available providers: ") +
					providers.map((p) => getProviderColor(p)(p)).join(", ") +
					"\n"
			);
			process.exit(1);
		}

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
				chalk.yellow(
					`\nDefault model already configured: ${modelColor(
						config.user.defaultModel
					)} ` +
						`from ${getProviderColor(config.user.defaultProvider)(
							config.user.defaultProvider
						)}\n`
				)
			);
			process.exit(0);
		}

		const model = await selectModel(providerName as Provider);
		if (!model) {
			console.log(
				chalk.yellow("\nExiting without setting default model.")
			);
			process.exit(0);
		}

		config.user.defaultModel = model;
		config.user.defaultProvider = providerName as Provider;
		fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

		logEvent(
			"info",
			`User configured default model: ${model} from provider ${providerName}`
		);

		console.log(
			chalk.green(
				`\nDefault model configured successfully: ${modelColor(
					model
				)} ` +
					`from ${getProviderColor(providerName as Provider)(
						providerName
					)}\n`
			)
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
