import fs from "fs";
import chalk from "chalk";
import { confirm, isCancel, cancel } from "@clack/prompts";
import { BASE_DIR, CONFIG_PATH } from "@/utils/paths";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

export default async function resetVoltx() {
	const args = process.argv.slice(2);
	const dangerFlag = args.includes("--danger");

	if (!fs.existsSync(CONFIG_PATH)) {
		console.log(
			chalk.yellow("Voltx not initialized.") +
				" Run " +
				chalk.cyan("`voltx init`") +
				" to set it up.",
		);
		process.exit(0);
	}

	if (!dangerFlag) {
		console.log(
			`${chalk.red.bold(
				"Warning:",
			)} This is an irreversible command and will remove all your data related to voltx.\n` +
				`If you're sure, run with the ${chalk.bold("--danger")} flag.`,
		);
		process.exit(0);
	}

	console.log(
		`${chalk.red.bold("Caution:")} This will permanently remove:\n` +
			`- configs\n- chats\n- logs\n- temp files\n- cache\n`,
	);

	const shouldDelete = await confirm({
		message: "Continue to deletion?",
		initialValue: false,
	});

	handleCancel(shouldDelete);

	if (!shouldDelete) {
		console.log(chalk.yellow("Aborted! No changes made."));
		process.exit(0);
	}

	try {
		fs.rmSync(BASE_DIR, { recursive: true, force: true });
		console.log(chalk.green("Success! voltx configurations cleared!"));
		console.log("Run `voltx -h` for help.");
	} catch (err) {
		console.error(chalk.red("Failed to clear voltx configurations."), err);
		process.exit(1);
	}
}

resetVoltx();
