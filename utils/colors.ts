import chalk from "chalk";

export function getProviderColor(provider: string) {
	switch (provider) {
		case "openai":
			return chalk.whiteBright;
		case "anthropic":
			return chalk.red;
		case "google":
			return chalk.green;
		case "deepseek":
			return chalk.blue;
		case "perplexity":
			return chalk.magenta;
		default:
			return chalk.greenBright;
	}
}

export const modelColor = chalk.cyan;
