import chalk from "chalk";
import { providers } from "@/utils/models.ts";

export default function listProviders() {
	console.log(chalk.bold.underline("\nAvailable Providers:\n"));
	providers.forEach((provider) => {
		let colorFn;
		switch (provider) {
			case "openai":
				colorFn = chalk.cyan;
				break;
			case "anthropic":
				colorFn = chalk.yellow;
				break;
			case "google":
				colorFn = chalk.green;
				break;
			case "deepseek":
				colorFn = chalk.blue;
				break;
			case "perplexity":
				colorFn = chalk.magenta;
				break;
			default:
				colorFn = chalk.red;
		}

		console.log(`- ${colorFn.bold(provider)}`);
	});
	console.log("");
}

listProviders();
