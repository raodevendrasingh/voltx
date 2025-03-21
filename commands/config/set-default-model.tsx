import fs from "fs";
import prompts from "prompts";
import { models, providers, Provider } from "@/utils/models.ts";
import { PROFILE_PATH } from "@/utils/paths.ts";
import chalk from "chalk";
import { getProviderColor, modelColor } from "@/utils/colors.ts";
import path from "path";

async function setDefaultModel() {
	const args = process.argv.slice(2);
	const providerArg = args.find((arg) => arg.startsWith("--provider="));
	const providerName = providerArg ? providerArg.split("=")[1] : null;

	if (!providerName || !providers.includes(providerName as Provider)) {
		console.error(
			`${chalk.red("Error:")} Invalid or missing provider.\n` +
				`Available providers: ${providers
					.map((p) => chalk.bold(p))
					.join(", ")}`
		);
		process.exit(1);
	}

	const colorFn = getProviderColor(providerName as Provider);
	console.log(
		chalk.bold(
			`\nSelect your default model for ${colorFn(providerName)}:\n`
		)
	);

	const response = await prompts({
		type: "select",
		name: "model",
		message: `Choose a default model for ${providerName}:`,
		choices: models[providerName as Provider].map((m) => ({
			title: modelColor(m),
			value: m,
		})),
	});

	if (!response.model) {
		console.log(chalk.yellow("No model selected. Exiting."));
		process.exit(0);
	}

	let profile = {};
	if (fs.existsSync(PROFILE_PATH)) {
		const rawProfile = fs.readFileSync(PROFILE_PATH, "utf-8");
		profile = JSON.parse(rawProfile);
	}

	const updatedProfile = {
		...profile,
		defaultProvider: providerName,
		defaultModel: response.model,
	};

	fs.mkdirSync(path.dirname(PROFILE_PATH), { recursive: true });
	fs.writeFileSync(PROFILE_PATH, JSON.stringify(updatedProfile, null, 2));

	console.log(
		`\n${chalk.green("Success!")} Set default model to ${modelColor(
			response.model
		)} for provider ${colorFn(providerName)}.\n`
	);
}

setDefaultModel();
