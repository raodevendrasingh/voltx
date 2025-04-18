import { ModelName, Provider } from "@/utils/models";

export interface Config {
	user: {
		username: string;
		createdAt: string;
		defaultModel: ModelName | null;
		defaultProvider: Provider | null;
		providers: Provider[];
	};
	[key: string]: any;
}
