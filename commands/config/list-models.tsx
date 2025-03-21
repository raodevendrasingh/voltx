import { getProviderColor, modelColor } from "@/utils/colors.ts";
import { models } from "@/utils/models.ts";
import chalk from "chalk";

function listModels() {
	console.log(chalk.bold("\nAvailable Models by Provider:\n"));

	Object.entries(models).forEach(([provider, modelList]) => {
		const colorFn = getProviderColor(provider);
		console.log(colorFn.bold(provider));
		modelList.forEach((model) => {
			console.log(`   - ${modelColor(model)}`);
		});
		console.log("");
	});
}

listModels();
