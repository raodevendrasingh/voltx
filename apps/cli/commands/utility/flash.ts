import fs, { readFileSync } from "fs";
import chalk from "chalk";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import loadConfig from "@/lib/load-config";
import { getLogoLines } from "@/utils/ascii";
import { CHATS_DIR } from "@/utils/paths";
import { VERSION } from "@/bin/version";
import { Provider } from "@/utils/models";

function _getSystemHostInfo(): string {
	try {
		const platform = os.platform();
		if (platform === "linux") {
			try {
				let productName = "";
				let productVersion = "";
				// Standard DMI paths for product info
				const namePath = "/sys/devices/virtual/dmi/id/product_name";
				const versionPath =
					"/sys/devices/virtual/dmi/id/product_version";

				if (fs.existsSync(namePath)) {
					productName = readFileSync(namePath, "utf8").trim();
				}
				if (fs.existsSync(versionPath)) {
					productVersion = readFileSync(versionPath, "utf8").trim();
				}

				if (productName && productVersion) {
					return `${productName} ${productVersion}`;
				} else if (productName) {
					return productName;
				} else if (productVersion) {
					return productVersion;
				}
				// Fallback if DMI info isn't available/readable
			} catch (e) {
				// Ignore errors reading DMI files, fallback below
			}
		} else if (platform === "darwin") {
			return execSync("sysctl -n hw.model").toString().trim();
		} else if (platform === "win32") {
			// WMIC output needs parsing
			const output = execSync("wmic csproduct get name").toString();
			const lines = output.split("\n");
			if (lines.length > 1) {
				return lines[1].trim(); // Second line usually contains the name
			}
		}
	} catch (error) {
		// If any command fails, fall back to hostname
	}
	return os.hostname();
}

function _getShellInfo(): string {
	let shellName = "Unknown";
	let shellVersion = "";

	try {
		const platform = os.platform();
		if (platform === "linux" || platform === "darwin") {
			const shellPath = process.env.SHELL;
			if (shellPath) {
				shellName = path.basename(shellPath);
				try {
					// Attempt to get version using common flags
					const versionOutput = execSync(`${shellName} --version`, {
						timeout: 1000, // Prevent hanging
						stdio: "pipe", // Prevent output/errors in console
					})
						.toString()
						.trim();

					// Extract version number (patterns vary between shells)
					let versionMatch =
						versionOutput.match(/(\d+\.\d+(\.\d+)?)/); // Basic pattern
					if (versionMatch) {
						shellVersion = versionMatch[0];
					} else if (shellName === "bash") {
						versionMatch = versionOutput.match(
							/version\s+(\d+\.\d+(\.\d+)?)/,
						);
						if (versionMatch) shellVersion = versionMatch[1];
					} else if (shellName === "zsh") {
						versionMatch = versionOutput.match(
							/^zsh\s+(\d+\.\d+(\.\d+)?)/,
						);
						if (versionMatch) shellVersion = versionMatch[1];
					}
					// Add more specific parsers for other shells if needed
				} catch (e) {
					// Failed to get version, just use the name
				}
			}
		} else if (platform === "win32") {
			const comSpec = process.env.ComSpec;
			if (comSpec && comSpec.toLowerCase().endsWith("cmd.exe")) {
				shellName = "cmd.exe";
				// cmd.exe version is tied to Windows version, hard to get separately
			}
			// Note: Reliably detecting PowerShell/pwsh externally is complex.
		}
	} catch (error) {
		// Ignore errors getting shell info
	}

	return shellVersion ? `${shellName} ${shellVersion}` : shellName;
}

export async function flash() {
	try {
		const config = loadConfig();

		const createdDate = config.user.createdAt
			? new Date(config.user.createdAt)
			: undefined;

		const chatFiles = fs.existsSync(CHATS_DIR)
			? fs.readdirSync(CHATS_DIR).filter((file) => file.endsWith(".txt"))
			: [];

		const configuredProviders = config.user.providers || [];

		// Prepare stats lines first
		const statsLines = [
			`${chalk.bold("VoltX Stats")}`,
			`${chalk.bold("-----------")}`,
			`${chalk.bold("Alias:")} ${chalk.cyan(config.user.alias || "N/A")}`,
			`${chalk.bold("Installed on:")} ${chalk.magenta(
				createdDate?.toDateString() || "N/A",
			)}`,
			`${chalk.bold("OS:")} ${chalk.yellow(`${os.type()} ${os.arch()}`)}`,
			`${chalk.bold("Host:")} ${chalk.blue(_getSystemHostInfo())}`,
			`${chalk.bold("Kernel:")} ${chalk.green(os.release())}`,
			`${chalk.bold("Shell:")} ${chalk.magenta(_getShellInfo())}`,
			`${chalk.bold("Providers Configured:")} ${chalk.yellow(
				configuredProviders.length.toString(),
			)}`,
			`${chalk.bold("Chats saved:")} ${chalk.red(
				chatFiles.length.toString(),
			)}`,
			`${chalk.bold("CLI Version:")} ${chalk.cyan(VERSION)}`,
		];

		// Prepare provider details lines separately
		const providerDetailLines: string[] = [];
		configuredProviders.forEach((provider: Provider) => {
			const providerConfig = config[provider] as
				| { DEFAULT_MODEL?: string }
				| undefined;
			// Only add if a default model is configured
			if (providerConfig?.DEFAULT_MODEL) {
				providerDetailLines.push(
					`  ${chalk.gray("•")} ${chalk.cyan(
						provider,
					)} ${chalk.gray("→")} ${chalk.yellow(
						providerConfig.DEFAULT_MODEL,
					)}`,
				);
			}
		});

		// Add provider details section header and lines if any defaults were found
		if (providerDetailLines.length > 0) {
			statsLines.push(`${chalk.bold("Configured Providers:")}`);
			statsLines.push(...providerDetailLines);
		} else if (configuredProviders.length > 0) {
			// If providers are configured but none have defaults set
			statsLines.push(
				`${chalk.bold("Configured Providers:")} ${chalk.gray("(None)")}`,
			);
		}
		// If configuredProviders.length is 0, we don't add the "Default Models Set" line at all.

		const logoLines = getLogoLines();
		const logoWidth = logoLines.reduce(
			(max, line) => Math.max(max, line.length),
			0,
		);
		const padding = "     "; // Add some padding between logo and stats
		const maxLines = Math.max(logoLines.length, statsLines.length);
		console.log();

		// Print side-by-side
		for (let i = 0; i < maxLines; i++) {
			const rawLogoLine = logoLines[i] || "";
			const statLine = statsLines[i] || "";
			const coloredLogoLine = chalk.greenBright(rawLogoLine); // Color the logo line
			const finalLogoPart =
				coloredLogoLine + " ".repeat(logoWidth - rawLogoLine.length);
			console.log(`${finalLogoPart}${padding}${statLine}`);
		}
		console.log();
	} catch (error) {
		console.error(chalk.red("\nError running flash command:"), error);
		process.exit(1);
	}
}
