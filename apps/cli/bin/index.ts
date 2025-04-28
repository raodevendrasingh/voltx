import { Command, program } from "commander";
import chalk from "chalk";
import { Provider, providers } from "@/utils/models";
import { flash } from "@/commands/utility/flash";
import { init } from "@/bin/init";
import { listProviders } from "@/commands/utility/list-providers";
import { listModels } from "@/commands/utility/list-models";
import { showDefaults } from "@/commands/config/defaults/show";
import { setDefaultChatModel } from "@/commands/config/setup/chat-model";
import { resetDefaults } from "@/commands/config/defaults/reset";
import { configureProvider } from "@/commands/config/setup/provider";
import { showConfig } from "@/commands/config/show";
import { startChat } from "@/features/chat";
import { log } from "@clack/prompts";
import { resetVoltx } from "@/commands/utility/reset";
import { VERSION } from "@/bin/version";
import { startAgent } from "@/features/agent";

program.version(VERSION, "-v, --version", "Display CLI version");

program.command("init").description("Initialize voltx").action(init);

program.command("flash").description("Show user info and stats").action(flash);

program.addCommand(
	new Command("list-providers")
		.description("List all supported model providers")
		.action(listProviders),
);

program.addCommand(
	new Command("list-models")
		.description("List all supported models by provider")
		.option(
			"--provider <provider-name>",
			"Specify a provider to list models for",
		)
		.action((options) => {
			listModels(options.provider);
		}),
);

program
	.command("config")
	.description("Manage configuration settings")
	.addCommand(
		new Command("show-defaults")
			.description("Show all configured default models")
			.action(showDefaults),
	)
	.addCommand(
		new Command("reset-defaults")
			.description("Reset all configured default models")
			.option("--hard", "Required flag for irreversible action")
			.action((options) => {
				resetDefaults(options.hard);
			}),
	)
	.addCommand(
		new Command("setup")
			.description("Setup configurations")
			.addCommand(
				new Command("chat-model")
					.description("Set the default model for chat sessions")
					.option("--provider <provider>", "Provider name")
					.action((options) => {
						if (!options.provider) {
							console.error(
								chalk.red(
									"\nError: Please provide a provider name with --provider flag\n",
								) +
									chalk.gray("Available providers: ") +
									providers
										.map((p) => chalk.bold(p))
										.join(", ") +
									"\n",
							);
							process.exit(1);
						}
						setDefaultChatModel(options.provider);
					}),
			)
			.addCommand(
				(() => {
					const providerCommand = new Command("provider")
						.description("Configure a specific provider")
						.action((options) => {
							let selectedProvider: Provider | undefined =
								undefined;
							for (const provider of providers) {
								if (options[provider]) {
									if (selectedProvider) {
										console.error(
											chalk.red(
												"\nError: Please specify only one provider flag at a time.\n" +
													"Example: --openai OR --groq\n",
											),
										);
										process.exit(1);
									}
									selectedProvider = provider;
								}
							}

							configureProvider(selectedProvider);
						});

					providers.forEach((provider) => {
						providerCommand.option(
							`--${provider}`,
							`Configure the ${provider} provider`,
						);
					});

					return providerCommand;
				})(),
			),
	);

program
	.command("show")
	.argument("<type>", "Type of information to show (only 'config' supported)")
	.description("Display the current configuration")
	.option("--unmasked", "Show unmasked API keys")
	.action((type, options) => {
		if (type !== "config") {
			console.error(chalk.red(`Unknown show type: ${type}`));
			console.log(
				chalk.gray(
					"Only 'config' is supported. Example: voltx show config",
				),
			);
			process.exit(1);
		}
		showConfig(options.unmasked).catch((error) => {
			console.error(chalk.red("Error showing configuration:"), error);
			process.exit(1);
		});
	});

program
	.command("agent")
	.argument("[provider]", "Provider to use for agent")
	.option("--temp", "Use temporary model selection")
	.description("Start an interactive agent session in the current directory")
	.action((provider, options) => {
		startAgent(provider as Provider | undefined, options.temp).catch(
			(error) => {
				log.error(`Failed to start agent session: ${error}`);
				process.exit(1);
			},
		);
	});

program
	.command("chat")
	.argument("[provider]", "Provider to use for chat")
	.option("--temp", "Use temporary model selection")
	.description("Start a new chat session")
	.action((provider, options) => {
		startChat(provider as Provider | undefined, options.temp).catch(
			(error) => {
				log.error(`Failed to start chat session: ${error}`);
				process.exit(1);
			},
		);
	});

program
	.command("reset")
	.description("Reset voltx configurations and remove all chats")
	.option("--danger", "Dangerous irreversible action")
	.action((options) => {
		resetVoltx(options.danger).catch((error: any) => {
			log.error(`Failed to reset voltx: ${error}`);
			process.exit(1);
		});
	});

program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	log.warn("Run with --help to see available commands.");
	process.exitCode = 1;
});

program.parse(process.argv);
