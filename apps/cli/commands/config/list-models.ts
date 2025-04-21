import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider } from "@/utils/models";
import { intro, log, outro } from "@clack/prompts";
import chalk from "chalk";

export function listModels(providerName?: string | null) {
	console.log("");
	intro(chalk.bold("Available Models by Provider"));

	if (providerName && !providers.includes(providerName as Provider)) {
		console.error(
			`${chalk.red("Error:")} Invalid provider "${providerName}". ` +
				`Available providers: ${providers
					.map((p) => chalk.bold(p))
					.join(", ")}`,
		);
		process.exit(1);
	}

	const providersToShow = providerName
		? [providerName as Provider]
		: (providers as readonly Provider[]);

	for (const provider of providersToShow) {
		const colorFn = getProviderColor(provider);
		const providerModels = models[provider];

		log.step(`${colorFn.italic(provider)}`);
		providerModels.forEach((model) => {
			console.log(`${chalk.gray("│")} - ${modelColor(model)}`);
		});
	}

	outro(chalk.gray.italic("(end)"));
}
