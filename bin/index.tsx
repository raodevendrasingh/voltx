#!/usr/bin/env node
import { program } from "commander";
import { spawn } from "child_process";
import chalk from "chalk";

program
	.version("0.1.0", "-v, --version", "Display CLI version")
	.command("init")
	.description("Initialize configuration")
	.action(() => {
		spawn("npx", ["tsx", "bin/init.tsx"], { stdio: "inherit" });
	});

program
	.command("whoami")
	.description("Show user info and stats")
	.action(() => {
		spawn("npx", ["tsx", "commands/whoami.tsx"], { stdio: "inherit" });
	});

program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Run with --help to see available commands.");
	process.exitCode = 1;
});

program.parse(process.argv);
