import fs from "fs";
import chalk from "chalk";
import figlet from "figlet";
import { Profile } from "@/utils/types.ts";
import pkg from "@/package.json" with { type: "json" };
import { CONFIG_PATH, PROFILE_PATH, CHATS_DIR } from "@/utils/config.ts";


const showAsciiArt = () => {
	console.log(
		chalk.green(
			figlet.textSync("System CLI", { horizontalLayout: "default" })
		)
	);
};

export async function whoami() {
	if (!fs.existsSync(PROFILE_PATH)) {
		console.log("Profile not found. Run `system init` first.");
		return;
	}

	const profileRaw = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf-8"));
	const profile: Profile & { createdAtDate?: Date } = {
		...profileRaw,
		createdAtDate: profileRaw.createdAt
			? new Date(profileRaw.createdAt)
			: undefined,
	};
	const config = fs.existsSync(CONFIG_PATH)
		? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
		: {};
	const chatFiles = fs.existsSync(CHATS_DIR)
		? fs.readdirSync(CHATS_DIR).filter((file) => file.endsWith(".txt"))
		: [];

	const stats = [
		`${chalk.bold("User:")} ${chalk.cyan(profile.name || "N/A")}`,
		`${chalk.bold("Email:")} ${chalk.green(profile.email || "N/A")}`,
		`${chalk.bold("Job Title:")} ${chalk.yellow(
			profile.jobTitle || "N/A"
		)}`,
		`${chalk.bold("Installed on:")} ${chalk.magenta(
			profile.createdAtDate?.toDateString() || "N/A"
		)}`,
		`${chalk.bold("Models configured:")} ${chalk.blue(
			Object.keys(config).length.toString()
		)}`,
		`${chalk.bold("Chats saved:")} ${chalk.red(
			chatFiles.length.toString()
		)}`,
		`${chalk.bold("CLI Version:")} ${chalk.cyan(pkg.version)}`,
	];

	console.log("\n");
	showAsciiArt();
	console.log("\n");
	stats.forEach((stat) => console.log(stat));
	console.log("\n");
}

whoami();
