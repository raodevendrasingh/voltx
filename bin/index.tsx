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

program
	.command("config-set-default-model")
	.description("Set the default model for a provider")
	.option("--provider <provider>", "Specify the provider")
	.action((options) => {
		const args = ["tsx", "commands/config/set-default-model.tsx"];
		if (options.provider) {
			args.push(`--provider=${options.provider}`);
		}
		spawn("npx", args, { stdio: "inherit" });
	});

program
	.command("config")
	.argument("<provider>", "Provider to configure")
	.description("Configure a provider with API key and default model")
	.action((provider) => {
		spawn("npx", ["tsx", "commands/config/provider.tsx", provider], {
			stdio: "inherit",
		});
	});

program
	.command("show-config")
	.description("Display the current configuration")
	.option("--unmasked", "Show unmasked API keys")
	.action((options) => {
		spawn(
			"npx",
			[
				"tsx",
				"commands/config/show.tsx",
				...(options.unmasked ? ["--unmasked"] : []),
			],
			{
				stdio: "inherit",
			}
		);
	});

program
	.command("reset")
	.description("Reset the system and remove all configs, profiles, and chats")
	.option("--danger", "Dangerous irreversible action")
	.action(() => {
		spawn("npx", ["tsx", "commands/reset.tsx", ...process.argv.slice(3)], {
			stdio: "inherit",
		});
	});

program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Run with --help to see available commands.");
	process.exitCode = 1;
});

program.parse(process.argv);
