import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider } from "@/utils/models";
import chalk from "chalk";

export default function listModels(providerName?: string | null) {
	console.log(chalk.bold("\nAvailable Models by Provider:\n"));

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

		console.log(`${colorFn(provider)}`);
		providerModels.forEach((model) => {
			console.log(`  - ${modelColor(model)}`);
		});
	}

	console.log("");
}
