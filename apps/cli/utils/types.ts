import { ModelName, Provider } from "@/utils/models";

export interface ProviderConfig {
	API_KEY: string;
	DEFAULT_MODEL: string | null;
}

export interface VoltxConfig {
	user: {
		alias: string;
		createdAt: string;
		defaultModel: ModelName | null;
		defaultProvider: Provider | null;
		providers: Provider[];
	};
	openai?: ProviderConfig;
	anthropic?: ProviderConfig;
	google?: ProviderConfig;
	deepseek?: ProviderConfig;
	perplexity?: ProviderConfig;
	[key: string]: any;
}
