#!/usr/bin/env node
import { program } from "commander";
import { spawn } from "child_process";
import chalk from "chalk";
import { pkg } from "@/utils/paths.ts";

program.version(pkg.version, "-v, --version", "Display CLI version");

program
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

program
	.command("config-list-providers")
	.description("List all supported model providers")
	.action(() => {
		spawn("npx", ["tsx", "commands/config/list-providers.tsx"], {
			stdio: "inherit",
		});
	});

program
	.command("config-list-models")
	.description("List all supported models by provider")
	.option("--provider <provider>", "Specify a provider to list models for")
	.action((options) => {
		const args = ["tsx", "commands/config/list-models.tsx"];
		if (options.provider) {
			args.push(`--provider=${options.provider}`);
		}
		spawn("npx", args, {
			stdio: "inherit",
		});
	});

program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Run with --help to see available commands.");
	process.exitCode = 1;
});

program.parse(process.argv);
