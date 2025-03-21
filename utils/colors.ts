import chalk from "chalk";

export function getProviderColor(provider: string) {
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

export const modelColor = chalk.cyan;
