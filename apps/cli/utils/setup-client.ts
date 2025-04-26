import OpenAI from "openai";
import loadConfig from "./load-config";

export const systemPrompt =
	"You are a helpful AI assistant named voltx. You can answer questions, provide explanations, and assist with various tasks. Your goal is to be as helpful and informative as possible. If you don't know the answer, it's okay to say you don't know.";

const config = loadConfig();

export const deepseek = config.deepseek?.API_KEY
	? new OpenAI({
			apiKey: config.deepseek.API_KEY,
			baseURL: "https://api.deepseek.com",
		})
	: null;

export const openai = config.openai?.API_KEY
	? new OpenAI({
			apiKey: config.openai.API_KEY,
		})
	: null;

export const gemini = config.google?.API_KEY
	? new OpenAI({
			apiKey: config.google.API_KEY,
			baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
		})
	: null;

export const perplexity = config.perplexity?.API_KEY
	? new OpenAI({
			apiKey: config.perplexity.API_KEY,
			baseURL: "https://api.perplexity.ai",
		})
	: null;

export const anthropic = config.anthropic?.API_KEY
	? new OpenAI({
			apiKey: config.anthropic.API_KEY,
			baseURL: "https://api.anthropic.com/v1/",
		})
	: null;

export type ClientMap = {
	openai: OpenAI | null;
	deepseek: OpenAI | null;
	google: OpenAI | null;
	perplexity: OpenAI | null;
	anthropic: OpenAI | null;
};

export const clients: ClientMap = {
	openai,
	deepseek,
	google: gemini,
	perplexity,
	anthropic,
};
