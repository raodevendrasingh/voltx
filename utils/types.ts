import { ModelName, Provider } from "@/utils/models.ts";

export interface Config {
	user: {
		username: string;
		createdAt: string;
		defaultModel: ModelName;
		defaultProvider: Provider;
		providers: Provider[];
	};
	[key: string]: any;
}
