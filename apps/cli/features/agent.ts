import fs from "fs";
import path from "path";
import chalk from "chalk";
import TOML from "@iarna/toml";
import loadConfig from "@/lib/load-config";
import { createApi } from "@/lib/create-api";
import {
	select,
	intro,
	outro,
	log,
	text,
	cancel,
	confirm,
	spinner,
} from "@clack/prompts";
import { logEvent } from "@/lib/logger";
import { CONFIG_PATH } from "@/utils/paths";
import { getProviderColor, modelColor } from "@/utils/colors";
import { providers, Provider, ModelName } from "@/utils/models";
import { spawn } from "child_process";
import {
	handleCancel,
	selectProvider,
	selectModel,
	askApiKey,
} from "@/lib/prompts";
import { loadHistory, saveHistory } from "@/lib/agent-history";
import { generateDirectoryTree } from "@/utils/generate-tree";

async function _getCommandFromModel(
	prompt: string,
	provider: Provider,
	model: ModelName,
): Promise<string> {
	const s = spinner();
	s.start(
		`Analyzing context and requesting command from ${modelColor(model)}...`,
	);

	// --- Generate System Prompt ---
	const currentDir = process.cwd();
	let directoryTree = "";
	try {
		directoryTree = generateDirectoryTree(currentDir);
	} catch (error) {
		log.warning(`Failed to generate directory tree: ${error}`);
		directoryTree = "[Could not generate directory tree]";
	}

	// Rename variable to systemPrompt
	const systemPrompt = `You are an AI assistant that translates natural language commands into executable shell commands for a ${process.platform} environment.
	Current Working Directory: ${currentDir}
	Directory Structure tree (excluding .gitignore contents):
	${directoryTree || "[Empty or unable to read directory]"}

	Use the provided directory structure to understand the context of the current working directory.
	Your task is to generate a shell command based on the user's input.
	You are not allowed to execute any commands or perform any actions outside of generating the command.
	Do not include any comments or code blocks in your output.
	Your response should be a single line shell command that can be executed in the current working directory.
	Only output the raw command itself, without any explanation, comments, or markdown formatting. Ensure commands are contextually appropriate for the current directory and its contents.`;
	// --- End System Prompt Generation ---

	s.message(`Requesting command from ${modelColor(model)}...`);

	try {
		const command = await createApi(model, provider, prompt, systemPrompt);
		s.stop(`Received command suggestion.`);
		return command
			.trim()
			.replace(/^```sh\n?|```$/g, "")
			.trim();
	} catch (error) {
		s.stop("Failed to get command from AI model.");
		log.error(`API call failed: ${error}`);
		return `echo "Error: Failed to get command from AI model. ${error instanceof Error ? error.message : ""}"`;
	}
}

function _executeCommand(command: string): Promise<void> {
	const s = spinner();
	s.start(`Executing: ${command}...`);
	return new Promise((resolve, reject) => {
		const modifiedCommand = command.replace(/\bnpx\b/g, "npm exec --");
		if (modifiedCommand !== command) {
			log.info(`(Using 'npm exec --' instead of 'npx')`);
		}

		const shell = process.platform === "win32" ? "cmd" : "sh";
		const args =
			process.platform === "win32"
				? ["/c", modifiedCommand]
				: ["-c", modifiedCommand];

		const child = spawn(shell, args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		s.stop(`Running command: ${modifiedCommand}`);

		let stderrOutput = "";
		let partialStdoutLine = "";
		let partialStderrLine = "";

		const prefix = chalk.gray("│") + "  ";

		child.stdout.on("data", (data) => {
			const textChunk = partialStdoutLine + data.toString();
			const lines = textChunk.split("\n");
			partialStdoutLine = lines.pop() || "";
			lines.forEach((line) => {
				process.stdout.write(`${prefix}${chalk.cyan(line)}\n`);
			});
		});

		child.stderr.on("data", (data) => {
			const textChunk = partialStderrLine + data.toString();
			const lines = textChunk.split("\n");
			partialStderrLine = lines.pop() || "";
			lines.forEach((line) => {
				process.stderr.write(`${prefix}${chalk.red(line)}\n`);
			});
			stderrOutput += data.toString();
		});

		child.on("error", (error) => {
			if (partialStdoutLine)
				process.stdout.write(
					`${prefix}${chalk.cyan(partialStdoutLine)}\n`,
				);
			if (partialStderrLine)
				process.stderr.write(
					`${prefix}${chalk.red(partialStderrLine)}\n`,
				);
			log.error(`Spawn error: ${error.message}`);
			reject(error);
		});

		child.on("close", (code) => {
			if (partialStdoutLine)
				process.stdout.write(
					`${prefix}${chalk.cyan(partialStdoutLine)}\n`,
				);
			if (partialStderrLine)
				process.stderr.write(
					`${prefix}${chalk.red(partialStderrLine)}\n`,
				);

			if (code === 0) {
				log.success("Command finished successfully.");
				resolve();
			} else {
				log.error(`Command failed with exit code ${code}.`);

				const npmErrorMatch = stderrOutput.match(/npm ERR!.*\n?/i);
				const specificError = npmErrorMatch
					? npmErrorMatch[0].trim()
					: null;
				reject(
					new Error(
						specificError ||
							stderrOutput.trim() ||
							`Command failed with exit code ${code}`,
					),
				);
			}
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

	const history = loadHistory();

	console.log();
	intro(chalk.yellowBright.bold("🤖 Agent Mode"));

	log.info(
		`Agent activated in ${chalk.blue.italic(
			currentDir,
		)} using ${modelColor.italic(model)} from ${getProviderColor(
			provider,
		).italic(provider)}`,
	);
	log.info("Type 'exit' or press Ctrl+C to quit.");
	log.info("Use '!h' to view and rerun history.");

	let loopShouldEnd = false;

	while (!loopShouldEnd) {
		let userPrompt = await text({
			message: promptPrefix,
			placeholder: "Enter command or '!h' for history...",
			validate: (value) => {
				if (!value) return "Please enter a command.";
			},
		});

		if (typeof userPrompt === "symbol") {
			handleCancel(userPrompt);
			loopShouldEnd = true;
			continue;
		}

		if ((userPrompt as string).toLowerCase() === "!h") {
			if (history.length === 0) {
				log.info("No history available yet for this session.");
				continue;
			}

			const recentHistory = [...history].reverse();
			const historyChoice = await select({
				message: "Select a command from history to rerun:",
				options: [
					...recentHistory.map((cmd, index) => ({
						value: cmd,
						label: `${index + 1}. ${cmd.length > 60 ? cmd.substring(0, 57) + "..." : cmd}`,
					})),
					{ value: null, label: "Cancel" },
				],
				maxItems: 15,
			});

			handleCancel(historyChoice);

			if (historyChoice === null) {
				continue;
			}

			userPrompt = historyChoice;
			log.info(`Rerunning: ${chalk.italic(userPrompt)}`);
		} else if (
			(userPrompt as string).toLowerCase() === "exit" ||
			(userPrompt as string).toLowerCase() === "quit"
		) {
			loopShouldEnd = true;
			continue;
		}

		const lowerCasePrompt = (userPrompt as string).toLowerCase();
		if (
			userPrompt &&
			lowerCasePrompt !== "!h" &&
			lowerCasePrompt !== "exit" &&
			lowerCasePrompt !== "quit" &&
			history[history.length - 1] !== userPrompt
		) {
			history.push(userPrompt as string);
		}

		try {
			const suggestedCommand = await _getCommandFromModel(
				userPrompt as string,
				provider,
				model,
			);

			if (suggestedCommand.toLowerCase() === "exit") {
				outro(chalk.yellow("Agent session ended."));
				break;
			}

			if (!suggestedCommand.trim()) {
				log.warning(
					"Received empty command suggestion from the model.",
				);
				continue;
			}

			log.info(`Suggested command: ${chalk.cyan(suggestedCommand)}`);

			const proceed = await confirm({
				message: "Do you want to run this command?",
			});

			handleCancel(proceed);

			if (proceed) {
				try {
					await _executeCommand(suggestedCommand);
					logEvent(
						"info",
						`Agent executed command: ${suggestedCommand}`,
					);
				} catch (execError) {
					logEvent(
						"error",
						`Agent command execution failed: ${execError}`,
					);
				}
			} else {
				log.info("Command skipped.");
				logEvent("info", `Agent skipped command: ${suggestedCommand}`);
			}
		} catch (error) {
			if (typeof error === "symbol") {
				handleCancel(error);
				loopShouldEnd = true;
			} else {
				log.error(`Agent error: ${error}`);
				logEvent("error", `Agent error processing command: ${error}`);
			}
		}
	}

	saveHistory(history);
	outro(chalk.yellow("Agent session ended."));
}

export async function startAgent(
	providerArg?: Provider,
	useTemp: boolean = false,
) {
	try {
		const config = loadConfig();
		let configUpdated = false;

		if (providerArg && !providers.includes(providerArg)) {
			log.error(`Invalid provider specified: ${providerArg}`);
			log.info(`Available providers: ${providers.join(", ")}`);
			process.exit(1);
		}

		let selectedProvider: Provider;
		let selectedModel: ModelName;

		if (useTemp) {
			intro(
				chalk.cyan("Select temporary provider and model for agent..."),
			);
			selectedProvider = providerArg || (await selectProvider());

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
		} else if (providerArg) {
			selectedProvider = providerArg;
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

			if (config[selectedProvider]?.DEFAULT_MODEL) {
				selectedModel = config[selectedProvider]!
					.DEFAULT_MODEL as ModelName;
				logEvent(
					"info",
					`Starting agent session with provider default ${selectedModel} from ${selectedProvider}`,
				);
			} else {
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
							API_KEY: config[selectedProvider]?.API_KEY || "",
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
		} else if (config.user.defaultProvider && config.user.defaultModel) {
			selectedProvider = config.user.defaultProvider;
			selectedModel = config.user.defaultModel;
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
		} else {
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
