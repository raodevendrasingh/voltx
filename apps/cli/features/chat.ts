import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import loadConfig from "@/lib/load-config";
import {
	select,
	isCancel,
	intro,
	outro,
	log,
	text,
	cancel,
} from "@clack/prompts";
import { logEvent } from "@/lib/logger";
import { CONFIG_PATH } from "@/utils/paths";
import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider, ModelName } from "@/utils/models";
import createChatInterface from "@/interface/chat-window";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

async function selectProvider(): Promise<Provider> {
	const provider = await select<Provider>({
		message: "Select a provider:",
		options: providers.map(
			(p) =>
				({
					value: p,
					label: getProviderColor(p)(p),
				}) as { value: typeof p; label: string },
		),
	});
	handleCancel(provider);
	return provider as Provider;
}

async function selectModel(provider: Provider): Promise<ModelName> {
	const message = `Select model from ${getProviderColor(provider)(provider)}:`;

	const options = models[provider].map((m) => ({
		value: m,
		label: modelColor(m),
	})) as any;

	const model = await select<ModelName>({
		message,
		options,
	});

	handleCancel(model);
	return model as ModelName;
}

const askApiKey = async (provider: Provider): Promise<string> => {
	const apiKey = await text({
		message: `Enter API key for ${getProviderColor(provider)(provider)}:`,
		validate: (input: string) => {
			if (!input || input.trim() === "") {
				return "API key is required";
			}
		},
	});
	handleCancel(apiKey);
	return apiKey as string;
};

export async function startChat(
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

		// --- Provider Configuration Check ---
		if (providerArg) {
			const provider = providerArg;
			if (!config[provider]?.API_KEY) {
				log.warning(
					`Provider ${getProviderColor(provider)(
						provider,
					)} is not configured. Let's set it up.`,
				);
				const apiKey = await askApiKey(provider);

				if (!config[provider]) {
					config[provider] = { API_KEY: apiKey, DEFAULT_MODEL: null };
				} else {
					config[provider]!.API_KEY = apiKey;
				}

				if (!config.user.providers.includes(provider)) {
					config.user.providers.push(provider);
				}
				configUpdated = true;
				logEvent("info", `User configured API key for ${provider}`);
			}

			// If --temp flag is used, go directly to model selection
			if (useTemp) {
				intro(
					chalk.cyan(
						`Selecting temporary model from ${getProviderColor(
							provider,
						)(provider)}...`,
					),
				);
				const selectedModel = await selectModel(provider);

				logEvent(
					"info",
					`Starting temporary chat session with ${selectedModel} from ${provider}`,
				);
				outro(
					chalk.cyan(
						`Starting chat session with ${modelColor(
							selectedModel,
						)} ` +
							`from ${getProviderColor(provider)(provider)}...`,
					),
				);

				// Write config *before* starting interface if needed
				if (configUpdated) {
					fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
					log.info(
						`Configuration updated (API key for ${getProviderColor(
							provider,
						)(provider)} saved).`,
					);
				}

				createChatInterface({
					model: selectedModel,
					provider: provider,
				});
				return;
			}

			// Check provider's default model
			const providerConfig = config[provider];
			if (providerConfig?.DEFAULT_MODEL) {
				logEvent(
					"info",
					`Starting chat session with ${providerConfig.DEFAULT_MODEL} from ${provider}`,
				);
				intro(
					chalk.cyan(
						`Starting chat session with ${modelColor(
							providerConfig.DEFAULT_MODEL,
						)} ` +
							`from ${getProviderColor(provider)(provider)}...`,
					),
				);

				if (configUpdated) {
					fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
					log.info(
						`Configuration updated (API key for ${getProviderColor(
							provider,
						)(provider)} saved).`,
					);
				}

				createChatInterface({
					model: providerConfig.DEFAULT_MODEL as ModelName,
					provider: provider,
				});
				return;
			}
		}

		if (
			!providerArg &&
			!useTemp &&
			config.user.defaultModel &&
			config.user.defaultProvider
		) {
			logEvent(
				"info",
				`Starting chat session with default model ${config.user.defaultModel} from ${config.user.defaultProvider}`,
			);
			intro(
				chalk.cyan(
					`Starting chat session with ${modelColor(
						config.user.defaultModel,
					)} ` +
						`from ${getProviderColor(config.user.defaultProvider)(
							config.user.defaultProvider,
						)}...`,
				),
			);
			createChatInterface({
				model: config.user.defaultModel,
				provider: config.user.defaultProvider,
			});
			return;
		}

		// --- Interactive Selection Logic ---
		let selectedProvider: Provider;
		let selectedModel: ModelName;
		let option: symbol | "default" | "temporary" | undefined = undefined;

		// Scenario 1: --temp with providerArg (API key handled above)
		if (useTemp && providerArg) {
			selectedProvider = providerArg;
			intro(
				chalk.cyan(
					`Selecting temporary model from ${getProviderColor(
						selectedProvider,
					)(selectedProvider)}...`,
				),
			);
			selectedModel = await selectModel(selectedProvider);
			option = "temporary";
		}
		// Scenario 2: --temp without providerArg
		else if (useTemp && !providerArg) {
			intro(
				chalk.cyan("Select a temporary model for this chat session..."),
			);
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
					`User configured API key for ${selectedProvider}`,
				);
			}
			selectedModel = await selectModel(selectedProvider);
			option = "temporary";
		}
		// Scenario 3: providerArg without --temp (API key handled above, default model missing)
		else if (providerArg && !useTemp) {
			selectedProvider = providerArg;
			log.warning(
				`No default model configured for ${getProviderColor(
					selectedProvider,
				)(selectedProvider)}.`,
			);
			option = await select<"default" | "temporary">({
				message: `Select a model for this session and optionally set it as default for ${getProviderColor(
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
		}
		// Scenario 4: No providerArg, no --temp, no global default
		else {
			log.warning("No default model configured.");
			option = await select<"default" | "temporary">({
				message: "How would you like to proceed?",
				options: [
					{
						label: "Set default provider and model for future sessions",
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
					`User configured API key for ${selectedProvider}`,
				);
			}
			selectedModel = await selectModel(selectedProvider);
		}

		if (!config[selectedProvider]) {
			config[selectedProvider] = {
				API_KEY: config[selectedProvider]?.API_KEY || "",
				DEFAULT_MODEL: null,
			};
		}

		// Set as default model if chosen
		if (option === "default") {
			if (providerArg) {
				// Set provider-specific default
				config[selectedProvider]!.DEFAULT_MODEL = selectedModel;
				logEvent(
					"info",
					`User set default chat model for ${selectedProvider} to ${selectedModel}`,
				);
				log.success(
					`Default model for ${getProviderColor(selectedProvider)(
						selectedProvider,
					)} configured successfully!`,
				);
			} else {
				// Set global default
				config.user.defaultModel = selectedModel;
				config.user.defaultProvider = selectedProvider;

				// Also set the provider's default model if it wasn't set globally before
				if (!config[selectedProvider]!.DEFAULT_MODEL) {
					config[selectedProvider]!.DEFAULT_MODEL = selectedModel;
				}
				logEvent(
					"info",
					`User set global default chat model to ${selectedModel} from provider ${selectedProvider}`,
				);
				log.success("Global default model configured successfully!");
			}
			configUpdated = true;
		}

		if (configUpdated) {
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
			log.info(`Configuration updated successfully.`);
		}

		logEvent(
			"info",
			`Starting chat session with ${selectedModel} from ${selectedProvider}`,
		);
		outro(
			chalk.cyan(
				`Starting chat session with ${modelColor(selectedModel)} ` +
					`from ${getProviderColor(selectedProvider)(
						selectedProvider,
					)}...`,
			),
		);

		createChatInterface({
			model: selectedModel,
			provider: selectedProvider,
		});
	} catch (error) {
		log.error(`Error starting chat: ${error}`);
		process.exit(1);
	}
}
