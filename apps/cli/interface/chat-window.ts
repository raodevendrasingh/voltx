import { formatDate, formatFileDate } from "@/utils/date";
import { ModelName, Provider } from "@/utils/models";
import { CHATS_DIR } from "@/utils/paths";
import blessed from "blessed";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { createApi } from "@/utils/create-api";
import markdown from "cli-markdown";
import { getProviderColor, modelColor } from "@/utils/colors";
import { outro } from "@clack/prompts";
import { VERSION } from "@/bin/version";

interface ChatInterfaceProps {
	model: ModelName;
	provider: Provider;
}

function createWelcomeMessage(width: number): string {
	const lines = [
		chalk.bold.blueBright(
			`                   Voltx v${VERSION}               `,
		),
		"",
		`press ${chalk.cyan("Esc")}  - Enter Normal mode / Exit Command mode`,
		`press ${chalk.cyan("Tab")}  - Switch focus between Input and Chat`,
		`type  ${chalk.cyan(":")}    - Enter Command mode (from Normal mode)`,
		`type  ${chalk.cyan(":q")}   - Quit without saving`,
		`type  ${chalk.cyan(":wq")}  - Save and quit`,
		"",
		chalk.gray("Start typing your query below."),
	];

	const maxLength = Math.max(
		...lines.map((line) => line.replace(/\u001b\[.*?m/g, "").length),
	);
	const horizontalPadding = Math.floor((width - maxLength) / 2) - 2;
	const paddingStr = " ".repeat(Math.max(0, horizontalPadding));

	// Add vertical padding (approximate centering)
	const verticalPaddingLines = 5; // Adjust as needed
	const topPadding = "\n".repeat(verticalPaddingLines);

	return topPadding + lines.map((line) => paddingStr + line).join("\n");
}

export default function createChatInterface({
	model,
	provider,
}: ChatInterfaceProps) {
	const screen = blessed.screen({
		smartCSR: true,
		title: `Voltx v${VERSION}`,
	});

	type Mode = "normal" | "insert" | "command";

	let currentMode: Mode = "insert";
	let isFirstQuery = true;

	let messages: string[] = [];
	let isCommandMode = false;

	const topBar = blessed.box({
		parent: screen,
		top: 0,
		left: 0,
		width: "100%",
		height: 1,
		style: {
			fg: "black",
			bg: "white",
		},
	});

	const chatBox = blessed.box({
		parent: screen,
		top: 1,
		left: 0,
		width: "100%",
		height: "80%",
		label: " Message Box ",
		border: {
			type: "line",
		},
		scrollable: true,
		alwaysScroll: true,
		mouse: true,
		keys: true,
		keyable: true,
		clickable: true,
		focusable: true,
		selectable: true,
		grabKeys: false,
		style: {
			fg: "white",
			border: {
				fg: "gray",
			},
		},
		scrollbar: {
			ch: " ",
			track: {
				bg: "gray",
			},
			style: {
				inverse: true,
			},
		},
		mouseDrag: true,
		mouseEvents: true,
		content: createWelcomeMessage(screen.width as number),
	});

	const inputBox = blessed.textbox({
		parent: screen,
		bottom: 1,
		left: 0,
		width: "100%",
		height: "20%-1",
		label: " Query Box ",
		border: {
			type: "line",
		},
		style: {
			border: {
				fg: "black",
			},
		},
		input: true,
		inputOnFocus: true,
		keys: true,
		mouse: true,
		vi: false,
		value: " Type your query here...",
	});

	// Clear placeholder on focus if it's the placeholder text
	inputBox.on("focus", () => {
		if (inputBox.value === " Type your query here...") {
			inputBox.clearValue();
			inputBox.style.fg = "white"; // Change text color to white
			screen.render();
		}
	});

	// Set placeholder if input is empty on blur
	inputBox.on("blur", () => {
		if (!inputBox.value.trim()) {
			inputBox.setValue(" Type your query here...");
			inputBox.style.fg = "gray"; // Change text color back to gray
			screen.render();
		}
	});

	// Optional: Clear placeholder on first keypress if it's still the placeholder
	inputBox.once("keypress", () => {
		if (inputBox.value === " Type your query here...") {
			inputBox.clearValue();
			inputBox.style.fg = "white";
			screen.render();
		}
	});

	const bottomBar = blessed.box({
		parent: screen,
		bottom: 0,
		left: 0,
		width: "100%",
		height: 1,
		style: {
			fg: "black",
			bg: "green",
		},
	});

	const commandInput = blessed.textbox({
		parent: screen,
		bottom: 0,
		left: 0,
		width: "30%",
		height: 1,
		style: {
			fg: "black",
			bg: "green",
		},
		keys: true,
		inputOnFocus: true,
		hidden: true,
	});

	function renderTopBar() {
		const version = `voltx v${VERSION}`;
		const status = "New Chat";
		const timestamp = formatDate(new Date());

		const leftPadding = 2;
		const rightPadding = (screen.width as number) - timestamp.length - 2;
		const centerPosition = Math.floor(
			((screen.width as number) - status.length) / 2,
		);

		topBar.setContent(
			`${" ".repeat(leftPadding)}${version}${" ".repeat(
				centerPosition - version.length - leftPadding,
			)}${status}${" ".repeat(
				rightPadding - centerPosition - status.length,
			)}${timestamp}`,
		);

		screen.render();
	}

	function updateBottomBar() {
		if (!isCommandMode) {
			const messageCount = `Messages: ${messages.length}`;
			const modeInfo = `--${currentMode.toUpperCase()}--`;
			const modelInfo = `${model} (${provider})`;
			const padding =
				(screen.width as number) -
				messageCount.length -
				modeInfo.length -
				modelInfo.length -
				8;

			bottomBar.setContent(
				`${" ".repeat(2)}${messageCount}${" ".repeat(
					3,
				)}${modeInfo}${" ".repeat(padding)}${modelInfo}${" ".repeat(2)}`,
			);
		}
		screen.render();
	}

	function updateCommandBar(cmd: string) {
		bottomBar.setContent(`${" ".repeat(2)}:${cmd}`);
		screen.render();
	}

	// Replace the input submit handler
	inputBox.on("submit", async (value) => {
		const trimmedValue = value.trim();
		if (!trimmedValue || trimmedValue === "Type your query here...") {
			inputBox.clearValue();
			screen.render();
			return;
		}

		if (isFirstQuery) {
			chatBox.setContent("");
			isFirstQuery = false;
		}

		const userMessage = `${modelColor("[user]")}: ${trimmedValue}`;
		const userQuery = `[user]: ${trimmedValue}`;
		messages.push(userQuery);
		chatBox.setContent(chatBox.getContent() + userMessage + "\n");

		// Reset input box to placeholder state after submit
		inputBox.setValue(" Type your query here...");
		inputBox.style.fg = "gray";
		inputBox.focus(); // Keep focus or manage as needed
		screen.render();

		try {
			const response = await createApi(model, provider, trimmedValue);
			const parsedResponse = markdown(response, {
				code: true,
				showLinks: true,
			});

			const providerColor = getProviderColor(provider);
			const aiResponse = `${providerColor(
				`[${provider}]`,
			)}: ${parsedResponse}`;

			const separator = chalk.gray(
				"─".repeat((screen.width as number) - 3),
			);

			const textResonse = `[${provider}]: ${response}`;

			messages.push(textResonse);
			chatBox.setContent(
				chatBox.getContent() + aiResponse + separator + "\n\n",
			);

			chatBox.scroll(chatBox.getScrollHeight());
			updateBottomBar();
			screen.render();
		} catch (error: any) {
			if (isFirstQuery) {
				chatBox.setContent("");
				isFirstQuery = false;
			}
			const errorMsg = `[system]: Error getting response from ${provider}: ${error.message}\n`;
			chatBox.setContent(chatBox.getContent() + errorMsg + "\n");
			messages.push(errorMsg);

			chatBox.scroll(chatBox.getScrollHeight());
			updateBottomBar();
			screen.render();
		}
	});

	renderTopBar();

	function cleanup() {
		screen.destroy();
	}

	function enterCommandMode() {
		currentMode = "command";
		isCommandMode = true;
		commandInput.show();
		commandInput.setValue(":");
		commandInput.focus();
		updateCommandBar("");
	}

	function exitCommandMode() {
		isCommandMode = false;
		commandInput.hide();
		commandInput.setValue("");
		inputBox.focus();
		renderTopBar();
	}

	// Modify enterInsertMode to properly handle input and placeholder
	function enterInsertMode() {
		currentMode = "insert";
		inputBox.focus();
		inputBox.style.border.fg = "green";
		chatBox.style.border.fg = "gray";
		// Ensure placeholder is cleared on focus if needed
		if (inputBox.value === " Type your query here...") {
			inputBox.clearValue();
			inputBox.style.fg = "white";
		}
		updateBottomBar();
	}

	function enterNormalMode() {
		currentMode = "normal";
		inputBox.cancel(); // Cancel input reading
		chatBox.focus();
		inputBox.style.border.fg = "gray"; // Reset border color
		chatBox.style.border.fg = "white";
		// Reset placeholder if input is empty when leaving insert mode
		if (!inputBox.value.trim()) {
			inputBox.setValue(" Type your query here...");
			inputBox.style.fg = "gray";
		}
		updateBottomBar();
	}

	commandInput.key(["escape"], () => {
		exitCommandMode();
	});

	commandInput.key(["enter"], () => {
		const command = commandInput.getValue().trim();
		if (command.startsWith(":")) {
			handleCommand(command);
		}
		exitCommandMode();
		screen.render();
	});

	function handleCommand(cmd: string) {
		switch (cmd) {
			case ":i":
				exitCommandMode();
				enterInsertMode();
				break;

			case ":q":
				cleanup();
				outro(chalk.red("Chat ended without saving!"));
				process.exit(0);
				break;

			case ":wq":
				if (messages.length > 0) {
					const firstQuery = messages[0]
						.replace(/^\[.*?\]:\s*/, "")
						.slice(0, 30)
						.replace(/[^a-zA-Z0-9]/g, "_");

					const filename = `${firstQuery}_${formatFileDate(
						new Date(),
					)}.txt`;
					const filePath = path.join(CHATS_DIR, filename);

					// Format messages for saving
					const formattedMessages = messages.join("\n");

					fs.writeFileSync(filePath, formattedMessages);
					cleanup();
					outro(chalk.greenBright(`Chat saved at path ${filePath}`));
					process.exit(0);
				}
				break;

			default:
				// Handle invalid commands
				break;
		}
	}

	// Modify screen key handlers
	screen.key(":", () => {
		if (!isCommandMode) {
			enterCommandMode();
			screen.render();
		}
	});

	screen.key(["escape"], () => {
		if (isCommandMode) {
			exitCommandMode();
		} else if (currentMode === "insert") {
			enterNormalMode();
		}
		screen.render();
	});

	screen.key(["tab"], () => {
		if (!isCommandMode) {
			if (screen.focused === inputBox) {
				chatBox.focus();
				chatBox.style.border.fg = "white";
				inputBox.style.border.fg = "gray"; // Reset border color on blur
				// Reset placeholder if needed on blur
				if (!inputBox.value.trim()) {
					inputBox.setValue(" Type your query here...");
					inputBox.style.fg = "gray";
				}
			} else {
				inputBox.focus();
				inputBox.style.border.fg = "green"; // Set border color on focus
				chatBox.style.border.fg = "gray";
				// Clear placeholder on focus if needed
				if (inputBox.value === " Type your query here...") {
					inputBox.clearValue();
					inputBox.style.fg = "white";
				}
			}
			screen.render();
		}
	});

	screen.key(["q", "C-c"], () => {
		return process.exit(0);
	});

	enterInsertMode();
	updateBottomBar();
	screen.render();
}
