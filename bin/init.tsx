#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";
import figlet from "figlet";

const CONFIG_DIR = path.join(os.homedir(), ".system-cli");
const PROFILE_PATH = path.join(CONFIG_DIR, "profile.json");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

interface Profile {
	name: string;
	email: string;
	jobTitle?: string;
	createdAt?: string;
}

const ensureDir = () => {
	if (!fs.existsSync(CONFIG_DIR)) {
		fs.mkdirSync(CONFIG_DIR);
	}
};

const loadJSON = (filePath: string) => {
	return fs.existsSync(filePath)
		? JSON.parse(fs.readFileSync(filePath, "utf8"))
		: {};
};

const saveJSON = (filePath: string, data: any) => {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const askProfileQuestions = async () => {
	console.log(chalk.cyanBright("Let’s set up your profile:"));
	const profile: Profile = await inquirer.prompt([
		{ type: "input", name: "name", message: "Enter your name:" },
		{ type: "input", name: "email", message: "Enter your email:" },
		{
			type: "input",
			name: "jobTitle",
			message: "Enter your job title (optional):",
		},
	]);

	profile.createdAt = new Date().toISOString();
	saveJSON(PROFILE_PATH, profile);
	console.log(chalk.green("Profile saved.\n"));
};

const askModelConfig = async () => {
	const config = loadJSON(CONFIG_PATH);
	let addMore = true;

	while (addMore) {
		const { model } = await inquirer.prompt([
			{
				type: "list",
				name: "model",
				message: "Select the model you want to configure:",
				choices: ["openai", "claude", "gemini", "deepseek"],
			},
		]);

		const { apiKey } = await inquirer.prompt([
			{
				type: "input",
				name: "apiKey",
				message: `Enter API key for ${model}:`,
			},
		]);

		config[model] = { apiKey, addedAt: new Date().toISOString() };

		const { more } = await inquirer.prompt([
			{
				type: "confirm",
				name: "more",
				message: "Add another model?",
				default: false,
			},
		]);

		addMore = more;
	}

	saveJSON(CONFIG_PATH, config);
	console.log(chalk.green("\nAPI keys saved.\n"));
};

const showBanner = () => {
	console.log(
		chalk.yellow(
			figlet.textSync("System CLI", { horizontalLayout: "default" })
		)
	);
};

const run = async () => {
	ensureDir();
	showBanner();

	if (!fs.existsSync(PROFILE_PATH)) {
		await askProfileQuestions();
	} else {
		console.log(chalk.gray("Profile exists. Skipping profile setup."));
	}

	await askModelConfig();
	console.log(chalk.greenBright("\nAll done! Your CLI is ready."));
};

run();
