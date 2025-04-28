import { select, isCancel, text, cancel } from "@clack/prompts";
import { getProviderColor, modelColor } from "@/utils/colors";
import { models, providers, Provider, ModelName } from "@/utils/models";

export const handleCancel = (value: unknown) => {
	if (isCancel(value)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
};

export async function selectProvider(
	providersToList?: Provider[],
): Promise<Provider> {
	const optionsSource = providersToList ?? providers;

	const provider = await select<Provider>({
		message: "Select a provider:",
		options: optionsSource.map(
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

export async function selectModel(provider: Provider): Promise<ModelName> {
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

export const askApiKey = async (provider: Provider): Promise<string> => {
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
