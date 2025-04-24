import OpenAI from "openai";
import config from "./load-config";
import { ProviderConfig } from "./types";

const requiredKeys = [
	"openai.API_KEY",
	"deepseek.API_KEY",
	"google.API_KEY",
	"perplexity.API_KEY",
	"anthropic.API_KEY",
] as const;

type Provider = keyof Omit<typeof config, "user">;
type Field = keyof ProviderConfig;

for (const key of requiredKeys) {
	const [provider, field] = key.split(".") as [Provider, Field];
	const providerConfig = config[provider];

	if (!providerConfig || !providerConfig[field]) {
		throw new Error(`Missing required config key: ${key}`);
	}
}

export const systemPrompt =
	"You are a helpful AI assistant named voltx. You can answer questions, provide explanations, and assist with various tasks. Your goal is to be as helpful and informative as possible. If you don't know the answer, it's okay to say you don't know.";

export const deepseek = new OpenAI({
	apiKey: config.deepseek!.API_KEY,
	baseURL: "https://api.deepseek.com",
});

export const openai = new OpenAI({
	apiKey: config.openai!.API_KEY,
});

export const gemini = new OpenAI({
	apiKey: config.google!.API_KEY,
	baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const perplexity = new OpenAI({
	apiKey: config.perplexity!.API_KEY,
	baseURL: "https://api.perplexity.ai",
});

export const anthropic = new OpenAI({
	apiKey: config.anthropic!.API_KEY,
	baseURL: "https://api.anthropic.com/v1/",
});
