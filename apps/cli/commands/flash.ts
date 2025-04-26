import fs from "fs";
import chalk from "chalk";
import loadConfig from "@/utils/load-config";
import { showBanner } from "@/utils/ascii";
import { CHATS_DIR } from "@/utils/paths";
import { VERSION } from "@/bin/version";
import { Provider } from "@/utils/models";

export async function flash() {
	try {
		const config = loadConfig();

		const createdDate = config.user.createdAt
			? new Date(config.user.createdAt)
			: undefined;

		const chatFiles = fs.existsSync(CHATS_DIR)
			? fs.readdirSync(CHATS_DIR).filter((file) => file.endsWith(".txt"))
			: [];

		const configuredProviders = config.user.providers || [];

		const stats = [
			`${chalk.bold("User:")} ${chalk.cyan(config.user.alias || "N/A")}`,
			`${chalk.bold("Installed on:")} ${chalk.magenta(
				createdDate?.toDateString() || "N/A",
			)}`,
			`${chalk.bold("Providers configured:")} ${chalk.blue(
				configuredProviders.length.toString(),
			)}`,
			`${chalk.bold("Chats saved:")} ${chalk.red(
				chatFiles.length.toString(),
			)}`,
			`${chalk.bold("CLI Version:")} ${chalk.cyan(VERSION)}`,
		];

		if (configuredProviders.length > 0) {
			stats.push(
				`\n${chalk.bold("Configured Providers:")}`,
				...configuredProviders.map(
					(provider: Provider) =>
						`  ${chalk.gray("•")} ${chalk.cyan(
							provider,
						)} ${chalk.gray("→")} ${
							config[provider]?.DEFAULT_MODEL
								? chalk.yellow(config[provider].DEFAULT_MODEL)
								: chalk.gray("(no defaults set)")
						}`,
				),
			);
		}

		showBanner();
		stats.forEach((stat) => console.log(stat));
		console.log("\n");
	} catch (error) {
		console.error(chalk.red("\nError reading configuration:"), error);
		process.exit(1);
	}
}
