import {
	anthropic,
	deepseek,
	gemini,
	openai,
	perplexity,
	systemPrompt,
} from "./ai-config";
import { ModelName, Provider } from "./models";

export async function getApi(
	model: ModelName,
	provider: Provider,
	query: string,
): Promise<string> {
	switch (provider) {
		case "openai":
			return openaiApi(model, query);

		case "anthropic":
			return anthropicApi(model, query);

		case "google":
			return geminiApi(model, query);

		case "deepseek":
			return deepseekApi(model, query);

		case "perplexity":
			return perplexityApi(model, query);

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

async function geminiApi(model: ModelName, query: string): Promise<string> {
	const response = await gemini.chat.completions.create({
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
		throw new Error("Received empty response from Gemini API");
	}

	return content;
}

async function deepseekApi(model: ModelName, query: string): Promise<string> {
	const response = await deepseek.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: query,
			},
		],
		model,
	});
	const content = response.choices[0].message.content;
	if (!content) {
		throw new Error("Received empty response from Deepseek API");
	}

	return content;
}

async function openaiApi(model: ModelName, query: string): Promise<string> {
	const response = await openai.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: query,
			},
		],
		model,
	});
	const content = response.choices[0].message.content;
	if (!content) {
		throw new Error("Received empty response from OpenAI API");
	}

	return content;
}

async function anthropicApi(model: ModelName, query: string): Promise<string> {
	const response = await anthropic.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: query,
			},
		],
		model,
	});
	const content = response.choices[0].message.content;
	if (!content) {
		throw new Error("Received empty response from Anthropic API");
	}

	return content;
}

async function perplexityApi(model: ModelName, query: string): Promise<string> {
	const response = await perplexity.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: query,
			},
		],
		model,
	});
	const content = response.choices[0].message.content;
	if (!content) {
		throw new Error("Received empty response from Perplexity API");
	}

	return content;
}
