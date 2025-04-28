import fs from "fs";
import path from "path";
import chalk from "chalk";
import TOML from "@iarna/toml";
import loadConfig from "@/lib/load-config";
import { createApi } from "@/lib/create-api";
import { agentPrompt } from "@/lib/setup-client";
import {
	select,
	intro,
	outro,
	log,
	text,
	cancel,
	confirm,
} from "@clack/prompts";
import { logEvent } from "@/lib/logger";
import { CONFIG_PATH } from "@/utils/paths";
import { getProviderColor, modelColor } from "@/utils/colors";
import { providers, Provider, ModelName } from "@/utils/models";
import { exec } from "child_process";
import {
	handleCancel,
	selectProvider,
	selectModel,
	askApiKey,
} from "@/lib/prompts";

async function getCommandFromModel(
	prompt: string,
	provider: Provider,
	model: ModelName,
): Promise<string> {
	log.info(
		chalk.dim(
			`Requesting command from ${modelColor(model)} for prompt: "${prompt}"...`,
		),
	);
	try {
		const command = await createApi(model, provider, prompt, agentPrompt);
		return command.trim();
	} catch (error) {
		log.error(`API call failed: ${error}`);
		return `echo "Error: Failed to get command from AI model. ${error instanceof Error ? error.message : ""}"`;
	}
}

// Function to execute a command in the shell
function executeCommand(command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				log.error(`Command execution error: ${error.message}`);
				reject(stderr || error.message);
				return;
			}
			if (stderr) {
				log.warning(`Command stderr: ${stderr}`);
				// Resolve even with stderr, as some commands use it for non-error output
			}
			resolve(stdout);
		});
	});
}

async function agentLoop(provider: Provider, model: ModelName) {
	const currentDir = process.cwd();
	const dirName = path.basename(currentDir);
	const promptPrefix =
		chalk.dim(`~${dirName} `) +
		chalk.yellowBright("« ") +
		chalk.green("agent") +
		chalk.green(" ⌘") +
		chalk.yellowBright(" »");

	console.log();
	intro(chalk.yellowBright.bold("Agent Mode"));

	log.info(
		`Agent activated in ${chalk.blue.italic(
			currentDir,
		)} using ${modelColor.italic(model)} from ${getProviderColor(
			provider,
		).italic(provider)}`,
	);
	log.info("Type 'exit' or press Ctrl+C to quit.");

	while (true) {
		const userInput = await text({
			message: promptPrefix,
			placeholder: "Enter your command in natural language...",
			validate: (value) => {
				if (!value) return "Please enter a command.";
			},
		});

		handleCancel(userInput);

		if (
			(userInput as string).toLowerCase() === "exit" ||
			(userInput as string).toLowerCase() === "quit"
		) {
			outro(chalk.yellow("Agent session ended."));
			break;
		}

		try {
			// Get suggested command from the actual API
			const suggestedCommand = await getCommandFromModel(
				userInput as string,
				provider,
				model,
			);

			if (suggestedCommand.toLowerCase() === "exit") {
				outro(chalk.yellow("Agent session ended."));
				break;
			}

			log.info(`Suggested command: ${chalk.cyan(suggestedCommand)}`);

			const proceed = await confirm({
				message: "Do you want to run this command?",
			});

			handleCancel(proceed);

			if (proceed) {
				log.info(chalk.gray(`Executing: ${suggestedCommand}...`));
				const output = await executeCommand(suggestedCommand);
				if (output.trim()) {
					const paddedOutput = output
						.trim()
						.split("\n")
						.map((line) => `${chalk.gray("│")}  ${line}`)
						.join("\n");

					console.log(paddedOutput);
				}
				log.success("Command executed.");
				logEvent("info", `Agent executed command: ${suggestedCommand}`);
			} else {
				log.info("Command skipped.");
				logEvent("info", `Agent skipped command: ${suggestedCommand}`);
			}
		} catch (error) {
			log.error(`Agent error: ${error}`);
			logEvent("error", `Agent error processing command: ${error}`);
		}
	}
}

export async function startAgent(
	providerArg?: Provider,
	useTemp: boolean = false,
) {
	try {
		const config = loadConfig();
		let configUpdated = false;

		// Validate providerArg if it exists
		if (providerArg && !providers.includes(providerArg)) {
			log.error(`Invalid provider specified: ${providerArg}`);
			log.info(`Available providers: ${providers.join(", ")}`);
			process.exit(1);
		}

		let selectedProvider: Provider;
		let selectedModel: ModelName;

		// --- Provider/Model Selection Logic (similar to startChat) ---

		// Priority 1: --temp flag (always prompts)
		if (useTemp) {
			intro(
				chalk.cyan("Select temporary provider and model for agent..."),
			);
			selectedProvider = providerArg || (await selectProvider());

			// Check/configure API key if needed
			if (!config[selectedProvider]?.API_KEY) {
				log.warning(
					`Provider ${getProviderColor(selectedProvider)(
						selectedProvider,
					)} is not configured. Let's set it up.`,
				);
				const apiKey = await askApiKey(selectedProvider);
				if (!config[selectedProvider]) {
					config[selectedProvider] = {
						API_KEY: apiKey,
						DEFAULT_MODEL: null,
					};
				} else {
					config[selectedProvider]!.API_KEY = apiKey;
				}
				if (!config.user.providers.includes(selectedProvider)) {
					config.user.providers.push(selectedProvider);
				}
				configUpdated = true;
				logEvent(
					"info",
					`User configured API key for ${selectedProvider} (agent temp)`,
				);
			}
			selectedModel = await selectModel(selectedProvider);
			logEvent(
				"info",
				`Starting temporary agent session with ${selectedModel} from ${selectedProvider}`,
			);
		}
		// Priority 2: providerArg provided
		else if (providerArg) {
			selectedProvider = providerArg;
			// Check/configure API key if needed
			if (!config[selectedProvider]?.API_KEY) {
				log.warning(
					`Provider ${getProviderColor(selectedProvider)(
						selectedProvider,
					)} is not configured. Let's set it up.`,
				);
				const apiKey = await askApiKey(selectedProvider);
				if (!config[selectedProvider]) {
					config[selectedProvider] = {
						API_KEY: apiKey,
						DEFAULT_MODEL: null,
					};
				} else {
					config[selectedProvider]!.API_KEY = apiKey;
				}
				if (!config.user.providers.includes(selectedProvider)) {
					config.user.providers.push(selectedProvider);
				}
				configUpdated = true;
				logEvent(
					"info",
					`User configured API key for ${selectedProvider} (agent)`,
				);
			}

			// Check for provider-specific default model
			if (config[selectedProvider]?.DEFAULT_MODEL) {
				selectedModel = config[selectedProvider]!
					.DEFAULT_MODEL as ModelName;
				logEvent(
					"info",
					`Starting agent session with provider default ${selectedModel} from ${selectedProvider}`,
				);
			} else {
				// No provider default, prompt to select and optionally set default
				log.warning(
					`No default model configured for ${getProviderColor(
						selectedProvider,
					)(selectedProvider)}.`,
				);
				const option = await select<"default" | "temporary">({
					message: `Select a model for this agent session and optionally set it as default for ${getProviderColor(
						selectedProvider,
					)(selectedProvider)}?`,
					options: [
						{
							label: `Set selected model as default for ${getProviderColor(
								selectedProvider,
							)(selectedProvider)}`,
							value: "default",
						},
						{
							label: "Use selected model temporarily",
							value: "temporary",
						},
					],
				});
				handleCancel(option);
				selectedModel = await selectModel(selectedProvider);
				if (option === "default") {
					if (!config[selectedProvider]) {
						config[selectedProvider] = {
							API_KEY: config[selectedProvider]?.API_KEY || "", // Should exist from check above
							DEFAULT_MODEL: null,
						};
					}
					config[selectedProvider]!.DEFAULT_MODEL = selectedModel;
					configUpdated = true;
					logEvent(
						"info",
						`User set default agent model for ${selectedProvider} to ${selectedModel}`,
					);
					log.success(
						`Default model for ${getProviderColor(selectedProvider)(
							selectedProvider,
						)} configured successfully!`,
					);
				}
			}
		}
		// Priority 3: Global default provider/model
		else if (config.user.defaultProvider && config.user.defaultModel) {
			selectedProvider = config.user.defaultProvider;
			selectedModel = config.user.defaultModel;
			// Verify API key exists for the default provider
			if (!config[selectedProvider]?.API_KEY) {
				log.error(
					`Default provider ${getProviderColor(selectedProvider)(
						selectedProvider,
					)} is configured but its API key is missing.`,
				);
				log.info(
					`Please run 'voltx config setup provider --${selectedProvider}' to add the key.`,
				);
				process.exit(1);
			}
			logEvent(
				"info",
				`Starting agent session with global default ${selectedModel} from ${selectedProvider}`,
			);
		}
		// Priority 4: No defaults, no args - prompt user
		else {
			intro(chalk.cyan("Configure agent provider and model..."));
			log.warning("No default agent model configured.");
			const option = await select<"default" | "temporary">({
				message: "How would you like to proceed?",
				options: [
					{
						label: "Set default provider and model for future agent sessions",
						value: "default",
					},
					{
						label: "Use temporary provider and model for this session",
						value: "temporary",
					},
				],
			});
			handleCancel(option);
			selectedProvider = await selectProvider();

			// Check/configure API key
			if (!config[selectedProvider]?.API_KEY) {
				log.warning(
					`Provider ${getProviderColor(selectedProvider)(
						selectedProvider,
					)} is not configured. Let's set it up.`,
				);
				const apiKey = await askApiKey(selectedProvider);
				if (!config[selectedProvider]) {
					config[selectedProvider] = {
						API_KEY: apiKey,
						DEFAULT_MODEL: null,
					};
				} else {
					config[selectedProvider]!.API_KEY = apiKey;
				}
				if (!config.user.providers.includes(selectedProvider)) {
					config.user.providers.push(selectedProvider);
				}
				configUpdated = true;
				logEvent(
					"info",
					`User configured API key for ${selectedProvider} (agent setup)`,
				);
			}

			selectedModel = await selectModel(selectedProvider);

			if (option === "default") {
				config.user.defaultModel = selectedModel;
				config.user.defaultProvider = selectedProvider;
				// Also set provider default if not set
				if (!config[selectedProvider]!.DEFAULT_MODEL) {
					config[selectedProvider]!.DEFAULT_MODEL = selectedModel;
				}
				configUpdated = true;
				logEvent(
					"info",
					`User set global default agent model to ${selectedModel} from provider ${selectedProvider}`,
				);
				log.success("Global default model configured successfully!");
			}
		}

		if (configUpdated) {
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
			log.info(`Configuration updated successfully.`);
		}

		await agentLoop(selectedProvider, selectedModel);
	} catch (error) {
		log.error(`Error starting agent: ${error}`);
		if (typeof error === "symbol") {
			cancel("Operation cancelled.");
		}
		process.exit(1);
	}
}
