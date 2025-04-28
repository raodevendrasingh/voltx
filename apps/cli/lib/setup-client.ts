import OpenAI from "openai";
import loadConfig from "@/lib/load-config";

export const chatPrompt =
	"You are a helpful AI assistant named voltx. You can answer questions, provide explanations, and assist with various tasks. Your goal is to be as helpful and informative as possible. If you don't know the answer, it's okay to say you don't know.";

export const agentPrompt = `You are an AI assistant operating within a command-line interface. Your goal is to translate natural language user requests into executable shell commands for the current operating system.
- Respond ONLY with the suggested shell command.
- Do not include any explanations, comments, markdown formatting, or introductory phrases like "Okay, here is the command:".
- If the user's request is unclear or ambiguous, respond with: echo "Error: Request is unclear. Please provide more details."
- If the user asks to exit or quit, respond with: exit
- If the request cannot be translated into a safe shell command (e.g., it's a question, a request for explanation, or potentially harmful), respond with: echo "Error: Cannot translate request into a safe command."
- Ensure the command is safe to execute. Avoid destructive commands unless explicitly confirmed by the user (though for now, just generate the command).
Example:
User: list all files in the current directory including hidden ones
Assistant: ls -la
User: create a new file named my_document.txt
Assistant: touch my_document.txt
User: tell me a joke
Assistant: echo "Error: Cannot translate request into a safe command."
User: exit
Assistant: exit`;

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
