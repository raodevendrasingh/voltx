import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider } from "@/utils/models";
import chalk from "chalk";

function listModels() {
	console.log(chalk.bold("\nAvailable Models by Provider:\n"));

	const args = process.argv.slice(2);
	const providerArg = args.find((arg) => arg.startsWith("--provider="));
	const providerName = providerArg ? providerArg.split("=")[1] : null;

	if (providerName && !providers.includes(providerName as Provider)) {
		console.error(
			`${chalk.red("Error:")} Invalid provider "${providerName}".` +
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

listModels();
