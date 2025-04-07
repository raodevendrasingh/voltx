import { ModelName, Provider } from "@/utils/models";

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
