import chalk from "chalk";
import { providers } from "@/utils/models";
import { getProviderColor } from "@/utils/colors";

export function listProviders() {
	console.log(chalk.bold.underline("\nAvailable Providers:\n"));

	providers.forEach((provider) => {
		const colorFn = getProviderColor(provider);
		console.log(`- ${colorFn.bold(provider)}`);
	});

	console.log("");
}
