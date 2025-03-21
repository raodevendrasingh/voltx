import { models } from "@/utils/models.ts";
import chalk from "chalk";

function getProviderColor(provider: string) {
	switch (provider) {
		case "openai":
			return chalk.yellow;
		case "anthropic":
			return chalk.red;
		case "google":
			return chalk.green;
		case "deepseek":
			return chalk.blue;
		case "perplexity":
			return chalk.magenta;
		default:
			return chalk.red;
	}
}

function listModels() {
	console.log(chalk.bold("\nAvailable Models by Provider:\n"));
	Object.entries(models).forEach(([provider, modelList]) => {
		const colorFn = getProviderColor(provider);
		console.log(colorFn.bold(provider));
		modelList.forEach((model) => {
			console.log(`   - ${chalk.cyan(model)}`);
		});
		console.log("");
	});
}

listModels();
