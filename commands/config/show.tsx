import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { Config } from "@/utils/types.ts";
import { CONFIG_PATH } from "@/utils/paths.ts";
import { Provider } from "@/utils/models.ts";
import { getProviderColor } from "@/utils/colors.ts";

function maskApiKey(key: string): string {
	if (key.length <= 5) return "*".repeat(key.length);
	return "*".repeat(key.length - 5) + key.slice(-5);
}

async function showConfig() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'voltx init' first.\n"
				)
			);
			process.exit(1);
		}

		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;
		const showUnmasked = process.argv.includes("--unmasked");

		const displayConfig = JSON.parse(JSON.stringify(config));

		if (!showUnmasked) {
			config.user.providers.forEach((provider: Provider) => {
				if (displayConfig[provider]?.API_KEY) {
					displayConfig[provider].API_KEY = maskApiKey(
						displayConfig[provider].API_KEY
					);
				}
			});
		}

		const output = TOML.stringify(displayConfig);
		console.log(chalk.bold("\nVoltx Configuration\n"));

		let lastSection = "";
		output.split("\n").forEach((line) => {
			if (line.startsWith("[")) {
				if (lastSection !== "") {
					console.log("");
				}
				const section = line.slice(1, -1);
				lastSection = section;
				console.log(
					section === "user"
						? chalk.cyan(line)
						: getProviderColor(section as Provider)(line)
				);
			} else if (line.includes("API_KEY")) {
				const [key, value] = line.split(" = ");
				console.log(`${chalk.yellow(key)} = ${chalk.red(value)}`);
			} else if (line.trim()) {
				const [key, value] = line.split(" = ");
				console.log(`${chalk.yellow(key)} = ${chalk.green(value)} `);
			}
		});

		if (!showUnmasked) {
			console.log(
				chalk.gray(
					"\nNote: API keys are masked. Use --unmasked to show full keys.\n"
				)
			);
		}
	} catch (error) {
		console.error(chalk.red("Error reading configuration:"), error);
		process.exit(1);
	}
}

showConfig().catch((error) => {
	console.error(chalk.red("Error showing configuration:"), error);
	process.exit(1);
});
