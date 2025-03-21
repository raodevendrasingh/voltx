import chalk from "chalk";
import { providers } from "@/utils/models.ts";
import { getProviderColor } from "@/utils/colors.ts";

export default function listProviders() {
	console.log(chalk.bold.underline("\nAvailable Providers:\n"));

	providers.forEach((provider) => {
		const colorFn = getProviderColor(provider);
		console.log(`- ${colorFn.bold(provider)}`);
	});

	console.log("");
}

listProviders();
