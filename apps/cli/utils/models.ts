export const providers = [
	"openai",
	"anthropic",
	"google",
	"deepseek",
	"perplexity",
] as const;

export const models = {
	openai: [
		"o3-mini-2025-01-31",
		"o1-preview-2024-09-12",
		"o1-mini-2024-09-12",
		"o1-2024-12-17",
		"gpt-4o-mini-2024-07-18",
		"gpt-4o-2024-11-20",
		"gpt-4.5-preview-2025-02-27",
		"gpt-4-turbo-preview",
		"gpt-4-turbo-2024-04-09",
		"gpt-4",
	],
	anthropic: [
		"claude-3-7-sonnet-20250219",
		"claude-3-5-sonnet-latest",
		"claude-3-5-haiku-latest",
	],
	google: [
		"gemini-1.5-flash-latest",
		"gemini-1.5-pro",
		"gemini-1.5-pro-latest",
		"gemini-2.0-flash-001",
		"gemini-2.0-flash-exp",
		"gemini-2.0-flash-lite-preview-02-05",
		"gemini-2.0-flash-thinking-exp-01-21",
		"gemini-2.0-pro-exp-02-05",
	],
	deepseek: ["deepseek-chat", "deepseek-reasoner"],
	perplexity: [
		"sonar",
		"sonar-pro",
		"sonar-reasoning",
		"sonar-reasoning-pro",
	],
} as const;

export type Provider = keyof typeof models;
export type ModelName = (typeof models)[Provider][number];
