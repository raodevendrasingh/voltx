#!/usr/bin/env node
import { Command, program } from "commander";
import { spawn } from "child_process";
import chalk from "chalk";
import { pkg } from "@/utils/paths.ts";
import { providers } from "@/utils/models.ts";

program.version(pkg.version, "-v, --version", "Display CLI version");

program
	.command("init")
	.description("Initialize configuration")
	.action(() => {
		spawn("npx", ["tsx", "bin/init.tsx"], { stdio: "inherit" });
	});

program
	.command("flash")
	.description("Show user info and stats")
	.action(() => {
		spawn("npx", ["tsx", "commands/flash.tsx"], { stdio: "inherit" });
	});

program
	.command("config")
	.description("Manage configuration settings")
	.addCommand(
		new Command("list-providers")
			.description("List all supported model providers")
			.action(() => {
				spawn("npx", ["tsx", "commands/config/list-providers.tsx"], {
					stdio: "inherit",
				});
			})
	)
	.addCommand(
		new Command("list-models")
			.description("List all supported models by provider")
			.option(
				"--provider <provider>",
				"Specify a provider to list models for"
			)
			.action((options) => {
				const args = ["tsx", "commands/config/list-models.tsx"];
				if (options.provider) {
					args.push(`--provider=${options.provider}`);
				}
				spawn("npx", args, { stdio: "inherit" });
			})
	)
	.addCommand(
		new Command("set").description("Set configuration options").addCommand(
			new Command("default")
				.description("Set default configurations")
				.addCommand(
					new Command("chat-model")
						.description("Set the default model for chat sessions")
						.option("--provider <provider>", "Provider name")
						.action((options) => {
							if (!options.provider) {
								console.error(
									chalk.red(
										"\nError: Please provide a provider name with --provider flag\n"
									) +
										chalk.gray("Available providers: ") +
										providers
											.map((p) => chalk.bold(p))
											.join(", ") +
										"\n"
								);
								process.exit(1);
							}
							spawn(
								"npx",
								[
									"tsx",
									"commands/config/defaults/chat-model.tsx",
									options.provider,
								],
								{
									stdio: "inherit",
								}
							);
						})
				)
		)
	)
	.addCommand(
		new Command("show-defaults")
			.description("Show all configured default models")
			.action(() => {
				spawn("npx", ["tsx", "commands/config/defaults/show.tsx"], {
					stdio: "inherit",
				});
			})
	)
	.addCommand(
		new Command("reset-defaults")
			.description("Reset all configured default models")
			.option("--hard", "Required flag for irreversible action")
			.action((options) => {
				spawn(
					"npx",
					[
						"tsx",
						"commands/config/defaults/reset.tsx",
						...(options.hard ? ["--hard"] : []),
					],
					{
						stdio: "inherit",
					}
				);
			})
	)
	.addCommand(
		new Command("setup").description("Setup configurations").addCommand(
			new Command("provider")
				.description("Configure a provider")
				.option("--<provider>", "Directly configure specified provider")
				.action(() => {
					spawn(
						"npx",
						[
							"tsx",
							"commands/config/setup/provider.tsx",
							...process.argv.slice(4),
						],
						{
							stdio: "inherit",
						}
					);
				})
		)
	);

program
	.command("show")
	.argument("config", "Show configuration")
	.description("Display the current configuration")
	.option("--unmasked", "Show unmasked API keys")
	.action((_, options) => {
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
	.command("start")
	.argument("<type>", "Type of session to start (chat)")
	.argument("[provider]", "Provider to use for chat")
	.option("--temp", "Use temporary model selection")
	.description("Start a new chat session")
	.action((type, provider, options) => {
		if (type !== "chat") {
			console.error(
				chalk.red("Only chat sessions are supported currently")
			);
			process.exit(1);
		}
		const args = ["tsx", "commands/chat/start.tsx"];
		if (provider) args.push(provider);
		if (options.temp) args.push("--temp");
		spawn("npx", args, { stdio: "inherit" });
	});

program
	.command("reset")
	.description("Reset voltx configurations and remove all chats")
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
