import chalk from "chalk";
import { providers } from "@/utils/models";
import { getProviderColor } from "@/utils/colors";
import { intro, log, outro } from "@clack/prompts";

export function listProviders() {
	console.log("");
	intro(chalk.bold("Available Providers"));

	providers.forEach((provider) => {
		const colorFn = getProviderColor(provider);
		log.step(`${colorFn(provider)}`);
	});

	outro(chalk.gray.italic("(end)"));
}
