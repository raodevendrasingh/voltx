import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import { BASE_DIR, CONFIG_PATH } from "@/utils/paths.ts";

async function resetVolt() {
	const args = process.argv.slice(2);
	const dangerFlag = args.includes("--danger");

	if (!fs.existsSync(CONFIG_PATH)) {
		console.log(
			chalk.yellow("Volt not initialized.") +
				" Run " +
				chalk.cyan("`volt init`") +
				" to set it up."
		);
		process.exit(0);
	}

	if (!dangerFlag) {
		console.log(
			`${chalk.red.bold(
				"Warning:"
			)} This is an irreversible command and will remove all your data related to volt.\n` +
				`If you're sure, run with the ${chalk.bold("--danger")} flag.`
		);
		process.exit(0);
	}

	console.log(
		`${chalk.red.bold("Caution:")} This will permanently remove:\n` +
			`- configs\n- chats\n- logs\n- temp files\n- cache\n`
	);

	const { confirm } = await inquirer.prompt([
		{
			type: "confirm",
			name: "confirm",
			message: "Continue to deletion?",
			default: false,
		},
	]);

	if (!confirm) {
		console.log(chalk.yellow("Aborted! No changes made."));
		process.exit(0);
	}

	try {
		fs.rmSync(BASE_DIR, { recursive: true, force: true });
		console.log(chalk.green("Success! volt configurations cleared!"));
		console.log("Run `volt -h` for help.");
	} catch (err) {
		console.error(chalk.red("Failed to clear volt configurations."), err);
		process.exit(1);
	}
}

resetVolt();
