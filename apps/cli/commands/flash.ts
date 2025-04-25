import fs from "fs";
import chalk from "chalk";
import config from "@/utils/load-config";
import { showBanner } from "@/utils/ascii";
import { CONFIG_PATH, CHATS_DIR } from "@/utils/paths";
import { log } from "@clack/prompts";
import { VERSION } from "@/bin/version";

export async function flash() {
	try {
		if (!fs.existsSync(CONFIG_PATH)) {
			log.warn(
				chalk.yellow("Voltx not initialized.") +
					" Run " +
					chalk.cyan("`voltx init`") +
					" to set it up.",
			);
			process.exit(0);
		}

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
					(provider) =>
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
