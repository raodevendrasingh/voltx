import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import inquirer from "inquirer";
import { Config } from "@/utils/types.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { models, providers, Provider } from "@/utils/models.ts";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { logEvent } from "@/utils/logger.ts";

async function configureProvider() {
	const providerName = process.argv[2];

	if (!providers.includes(providerName as Provider)) {
		console.error(
			`${chalk.red("Error:")} Invalid provider "${providerName}". ` +
				`Available providers: ${providers
					.map((p) => chalk.bold(p))
					.join(", ")}`
		);
		process.exit(1);
	}

	if (!fs.existsSync(CONFIG_PATH)) {
		console.log(
			chalk.yellow(
				"\nNo configuration found. Please run 'volt init' first.\n"
			)
		);
		process.exit(1);
	}

	const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
	const config = TOML.parse(configContent) as Config;

	if (config.user.providers.includes(providerName as Provider)) {
		console.log(
			chalk.yellow(`\nProvider "${providerName}" is already configured.`)
		);
		const unconfiguredProviders = providers.filter(
			(p) => !config.user.providers.includes(p)
		);
		if (unconfiguredProviders.length > 0) {
			console.log(
				`\nYou can configure these providers: ${unconfiguredProviders
					.map((p) => getProviderColor(p)(p))
					.join(", ")}`
			);
		}
		process.exit(0);
	}

	const { apiKey } = await inquirer.prompt([
		{
			type: "input",
			name: "apiKey",
			message: `Enter API key for ${getProviderColor(providerName)(
				providerName
			)}:`,
			validate: (input: string) =>
				input.trim() !== "" || "API key is required",
		},
	]);

	const { model } = await inquirer.prompt([
		{
			type: "list",
			name: "model",
			message: `Select default model for ${getProviderColor(providerName)(
				providerName
			)}:`,
			choices: models[providerName as Provider].map((m) => ({
				name: modelColor(m),
				value: m,
			})),
		},
	]);

	config[providerName] = {
		API_KEY: apiKey,
		DEFAULT_MODEL: model,
	};
	config.user.providers.push(providerName as Provider);

	fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));

	logEvent(
		"info",
		`User ${config.user.username} configured provider: ${providerName} with model: ${model}`
	);

	console.log(
		chalk.green(
			`\nSuccess! Provider ${getProviderColor(providerName)(
				providerName
			)} configured with model ${modelColor(model)}\n`
		)
	);
}

configureProvider().catch((error) => {
	console.error(chalk.red("Error during provider configuration:"), error);
	process.exit(1);
});
