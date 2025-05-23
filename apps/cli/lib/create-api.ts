import OpenAI from "openai";
import { clients } from "@/lib/setup-client";
import type { ModelName, Provider } from "@/utils/models";

async function _callChatCompletionApi(
	client: OpenAI,
	model: ModelName,
	query: string,
	systemPrompt: string,
): Promise<string> {
	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{ role: "system", content: systemPrompt },
	];

	const userQuery = query;

	messages.push({
		role: "user",
		content: userQuery,
	});

	const response = await client.chat.completions.create({
		model,
		messages: messages,
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
	systemPrompt: string,
): Promise<string> {
	const client = clients[provider];

	if (!client) {
		throw new Error(`${provider} provider is not configured.`);
	}

	try {
		return await _callChatCompletionApi(client, model, query, systemPrompt);
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
