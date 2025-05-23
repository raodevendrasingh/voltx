import chalk from "chalk";
import TOML from "@iarna/toml";
import loadConfig from "@/lib/load-config";
import { Provider } from "@/utils/models";
import { getProviderColor } from "@/utils/colors";

function maskApiKey(key: string): string {
	if (key.length <= 5) return "*".repeat(key.length);
	return "*".repeat(key.length - 5) + key.slice(-5);
}

export async function showConfig(showUnmasked: boolean = false) {
	try {
		const config = loadConfig();

		const displayConfig = JSON.parse(JSON.stringify(config));

		if (!showUnmasked) {
			config.user.providers.forEach((provider: Provider) => {
				if (displayConfig[provider]?.API_KEY) {
					displayConfig[provider].API_KEY = maskApiKey(
						displayConfig[provider].API_KEY,
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
						: getProviderColor(section as Provider)(line),
				);
			} else if (line.includes("API_KEY")) {
				const [key, value] = line.split(" = ");
				console.log(`${chalk.yellow(key)} = ${chalk.red(value)}`);
			} else if (line.trim()) {
				const [key, value] = line.split(" = ");
				console.log(`${chalk.yellow(key)} = ${chalk.green(value)} `);
			}
		});

		// Use the passed argument for the note
		if (!showUnmasked) {
			console.log(
				chalk.gray(
					"\nNote: API keys are masked. Use --unmasked flag to show full keys.\n",
				),
			);
		}
	} catch (error) {
		console.error(chalk.red("Error reading configuration:"), error);
		throw error;
	}
}
