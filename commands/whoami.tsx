import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import { Config } from "@/utils/types.ts";
import { showAsciiArt } from "@/utils/ascii.ts";
import { CONFIG_PATH, CHATS_DIR, pkg } from "@/utils/paths.ts";

export async function whoami() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			console.log(
				chalk.yellow(
					"\nNo configuration found. Please run 'system init' first.\n"
				)
			);
			process.exit(1);
		}

		const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
		const config = TOML.parse(configContent) as Config;

		const createdDate = config.user.createdAt
			? new Date(config.user.createdAt)
			: undefined;

		const chatFiles = fs.existsSync(CHATS_DIR)
			? fs.readdirSync(CHATS_DIR).filter((file) => file.endsWith(".txt"))
			: [];

		const configuredProviders = config.user.providers || [];

		const stats = [
			`${chalk.bold("User:")} ${chalk.cyan(
				config.user.username || "N/A"
			)}`,
			`${chalk.bold("Installed on:")} ${chalk.magenta(
				createdDate?.toDateString() || "N/A"
			)}`,
			`${chalk.bold("Providers configured:")} ${chalk.blue(
				configuredProviders.length.toString()
			)}`,
			`${chalk.bold("Chats saved:")} ${chalk.red(
				chatFiles.length.toString()
			)}`,
			`${chalk.bold("CLI Version:")} ${chalk.cyan(pkg.version)}`,
		];

		if (configuredProviders.length > 0) {
			stats.push(
				`\n${chalk.bold("Configured Providers:")}`,
				...configuredProviders.map(
					(provider) =>
						`  ${chalk.gray("•")} ${chalk.cyan(
							provider
						)} ${chalk.gray("→")} ${chalk.yellow(
							config[provider].DEFAULT_MODEL
						)}`
				)
			);
		}

		console.log("\n");
		showAsciiArt();
		console.log("\n");
		stats.forEach((stat) => console.log(stat));
		console.log("\n");
	} catch (error) {
		console.error(chalk.red("\nError reading configuration:"), error);
		process.exit(1);
	}
}

whoami();
