import fs from "fs";
import chalk from "chalk";
import TOML from "@iarna/toml";
import loadConfig from "@/utils/load-config";
import { select, isCancel, intro, outro, log } from "@clack/prompts";
import { logEvent } from "@/utils/logger";
import { CONFIG_PATH } from "@/utils/paths";
import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider, ModelName } from "@/utils/models";
import createChatInterface from "@/interface/chat-window";

const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		outro(chalk.yellow("Operation cancelled."));
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

export async function startChat(
	providerArg?: Provider, // Make provider optional and typed
	useTemp: boolean = false, // Default useTemp to false
) {
	try {
		const config = loadConfig();

		// Validate providerArg if it exists
		if (providerArg && !providers.includes(providerArg)) {
			log.error(`Invalid provider specified: ${providerArg}`);
			log.info(`Available providers: ${providers.join(", ")}`);
			process.exit(1);
		}

		// If provider specified
		if (providerArg) {
			const provider = providerArg; // Use the argument directly

			// If --temp flag is used, go directly to model selection
			if (useTemp) {
				console.log("");
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
				createChatInterface({
					model: providerConfig.DEFAULT_MODEL as ModelName,
					provider: provider,
				});
				return;
			}
		}

		// If no provider specified OR provider specified but no default model, check global default (unless --temp)
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

		// --- Selection Logic ---
		let selectedProvider: Provider;
		let selectedModel: ModelName;
		let option: symbol | "default" | "temporary" | undefined = undefined;

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
		} else if (useTemp && !providerArg) {
			intro(chalk.cyan("Selecting temporary provider and model..."));
			selectedProvider = await selectProvider();
			selectedModel = await selectModel(selectedProvider);
			option = "temporary";
		} else if (providerArg && !useTemp) {
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
		} else {
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
			selectedModel = await selectModel(selectedProvider);
		}

		// Set as default if chosen
		if (option === "default") {
			if (!config[selectedProvider]) {
				config[selectedProvider] = { API_KEY: "" };
			}
			if (providerArg) {
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
				config.user.defaultModel = selectedModel;
				config.user.defaultProvider = selectedProvider;
				logEvent(
					"info",
					`User set global default chat model to ${selectedModel} from provider ${selectedProvider}`,
				);
				log.success("Global default model configured successfully!");
			}
			fs.writeFileSync(CONFIG_PATH, TOML.stringify(config));
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
