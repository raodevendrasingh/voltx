import { formatDate, formatFileDate } from "@/utils/date";
import { ModelName, Provider } from "@/utils/models";
import { CHATS_DIR, pkg } from "@/utils/paths";
import blessed from "blessed";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { getApi } from "@/utils/get-api";
import markdown from "cli-markdown";
import { getProviderColor, modelColor } from "@/utils/colors";

interface ChatInterfaceProps {
	model: ModelName;
	provider: Provider;
}

export default function createChatInterface({
	model,
	provider,
}: ChatInterfaceProps) {
	const screen = blessed.screen({
		smartCSR: true,
	});

	type Mode = "normal" | "insert" | "command";

	let currentMode: Mode = "insert";

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
		border: {
			type: "line",
		},
		scrollable: true,
		alwaysScroll: true,
		mouse: true,
		keys: true,
		keyable: true, // Enable key events
		clickable: true, // Enable click events
		focusable: true, // Enable focus
		selectable: true,
		grabKeys: false, // Change to false
		style: {
			fg: "white",
			bg: "black",
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
	});

	// Modify the inputBox configuration
	const inputBox = blessed.textbox({
		parent: screen,
		bottom: 1,
		left: 0,
		width: "100%",
		height: "20%-1",
		border: {
			type: "line",
		},
		style: {
			fg: "white",
			bg: "black",
			border: {
				fg: "black",
			},
		},
		input: true,
		inputOnFocus: true,
		keys: true,
		mouse: true,
		vi: false,
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
		const version = `voltx v${pkg.version}`;
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
		if (!value || !value.trim()) {
			inputBox.clearValue();
			screen.render();
			return;
		}

		const userMessage = `${modelColor("[user]")}: ${value.trim()}`;
		const userQuery = `[user]: ${value.trim()}`;
		messages.push(userQuery);
		chatBox.setContent(chatBox.getContent() + userMessage + "\n");

		inputBox.clearValue();
		inputBox.focus();
		screen.render();

		try {
			const response = await getApi(model, provider, value.trim());
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

	// Modify enterInsertMode to properly handle input
	function enterInsertMode() {
		currentMode = "insert";
		inputBox.focus();
		inputBox.style.border.fg = "green";
		chatBox.style.border.fg = "gray";
		updateBottomBar();
	}

	function enterNormalMode() {
		currentMode = "normal";
		inputBox.cancel(); // Cancel input reading
		chatBox.focus();
		inputBox.style.border.fg = "gray";
		chatBox.style.border.fg = "white";
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
				console.log(chalk.red("Chat ended without saving!"));
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
					console.log(
						chalk.greenBright(`Chat saved at path ${filePath}`),
					);
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
				inputBox.style.border.fg = "gray";
			} else {
				inputBox.focus();
				inputBox.style.border.fg = "green";
				chatBox.style.border.fg = "gray";
			}
			screen.render();
		}
	});

	screen.key(["q", "C-c"], () => {
		return process.exit(0);
	});

	enterInsertMode();
	screen.render();
}
