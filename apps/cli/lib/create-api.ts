import OpenAI from "openai";
import { systemPrompt, clients } from "@/lib/setup-client";
import type { ModelName, Provider } from "@/utils/models";

async function _callChatCompletionApi(
	client: OpenAI,
	model: ModelName,
	query: string,
): Promise<string> {
	const response = await client.chat.completions.create({
		model,
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: query,
			},
		],
	});

	const content = response.choices[0].message.content;

	if (!content) {
		throw new Error("Received empty response from the API provider");
	}

	return content;
}

export async function createApi(
	model: ModelName,
	provider: Provider,
	query: string,
): Promise<string> {
	const client = clients[provider];

	if (!client) {
		throw new Error(`${provider} provider is not configured.`);
	}

	try {
		return await _callChatCompletionApi(client, model, query);
	} catch (error: unknown) {
		if (error instanceof Error) {
			throw new Error(
				`API call failed for ${provider}: ${error.message}`,
			);
		}
		throw new Error(
			`An unexpected error occurred during the API call for ${provider}`,
		);
	}
}
