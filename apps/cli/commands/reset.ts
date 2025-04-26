import fs from "fs";
import chalk from "chalk";
import { confirm, isCancel, cancel, log, outro, intro } from "@clack/prompts";
import { BASE_DIR, CONFIG_PATH } from "@/utils/paths";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

export async function resetVoltx(dangerFlag: boolean) {
	if (!fs.existsSync(CONFIG_PATH)) {
		log.warn(
			chalk.yellow("Voltx not initialized.") +
				" Run " +
				chalk.cyan("`voltx init`") +
				" to set it up.",
		);
		console.log();
		process.exit(0);
	}

	console.log();
	intro(`${chalk.bold("Resetting voltx configurations")}`);

	if (!dangerFlag) {
		log.warn(
			`${chalk.red.bold(
				"Warning:",
			)} This is an irreversible command and will remove all your data related to voltx.`,
		);

		outro(`If you're sure, run with the ${chalk.bold("--danger")} flag.`);
		process.exit(0);
	}

	log.warn(
		`${chalk.red.bold("Caution:")} This will permanently remove all your voltx configurations and data.\n` +
			`This action cannot be undone. Please ensure you have backups if necessary.`,
	);

	const shouldDelete = await confirm({
		message: "Continue to deletion?",
		initialValue: false,
	});

	handleCancel(shouldDelete);

	if (!shouldDelete) {
		log.error(chalk.yellow("Aborted! No changes made."));
		process.exit(0);
	}

	try {
		fs.rmSync(BASE_DIR, { recursive: true, force: true });
		log.success(chalk.green("Success! voltx configurations cleared!"));
		outro("Run `voltx -h` for help.");
	} catch (err) {
		console.error(chalk.red("Failed to clear voltx configurations."), err);
		process.exit(1);
	}
}
