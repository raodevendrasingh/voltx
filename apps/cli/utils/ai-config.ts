import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const requiredKeys = [
	"OPENAI_API_KEY",
	"ANTHROPIC_API_KEY",
	"GEMINI_API_KEY",
	"DEEPSEEK_API_KEY",
	"PERPLEXITY_API_KEY",
];

for (const key of requiredKeys) {
	if (!process.env[key]) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
}

export const systemPrompt =
	"You are a helpful AI assistant named voltx. You can answer questions, provide explanations, and assist with various tasks. Your goal is to be as helpful and informative as possible. If you don't know the answer, it's okay to say you don't know.";

export const deepseek = new OpenAI({
	apiKey: process.env["DEEPSEEK_API_KEY"],
	baseURL: "https://api.deepseek.com",
});

export const openai = new OpenAI({
	apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

export const gemini = new OpenAI({
	apiKey: process.env["GEMINI_API_KEY"],
	baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const perplexity = new OpenAI({
	apiKey: process.env["PERPLEXITY_API_KEY"],
	baseURL: "https://api.perplexity.ai",
});

export const anthropic = new OpenAI({
	apiKey: process.env["ANTHROPIC_API_KEY"],
	baseURL: "https://api.anthropic.com/v1/",
});
