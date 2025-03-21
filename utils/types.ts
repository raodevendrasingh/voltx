import { Provider } from "@/utils/models.ts";

export interface Config {
	user: {
		username: string;
		createdAt: string;
		providers: Provider[];
	};
	[key: string]: any;
}
