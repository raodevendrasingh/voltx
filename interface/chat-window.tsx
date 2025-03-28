import { formatDate, formatFileDate } from "@/utils/date.ts";
import { ModelName, Provider } from "@/utils/models.ts";
import { pkg } from "@/utils/paths.ts";
import blessed from "blessed";

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
		grabKeys: true,
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

	const inputBox = blessed.textbox({
		parent: screen,
		bottom: 1,
		left: 0,
		width: "100%",
		height: "20%-1",
		inputOnFocus: true,
		keys: true,
		mouse: true,
		keyable: true,
		clickable: true,
		focusable: true,
		grabKeys: false,
		border: {
			type: "line",
		},
		style: {
			fg: "white",
			bg: "black",
			border: {
				fg: "green",
			},
		},
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

	let messages: string[] = [];

	function updateUI() {
		const version = `volt v${pkg.version}`;
		const status = "New Chat";
		const timestamp = formatDate(new Date());

		const leftPadding = 2;
		const rightPadding = (screen.width as number) - timestamp.length - 2;
		const centerPosition = Math.floor(
			((screen.width as number) - status.length) / 2
		);

		topBar.setContent(
			`${" ".repeat(leftPadding)}${version}${" ".repeat(
				centerPosition - version.length - leftPadding
			)}${status}${" ".repeat(
				rightPadding - centerPosition - status.length
			)}${timestamp}`
		);

		const messageCount = `Messages: ${messages.length}`;
		const modelInfo = `${model} (${provider})`;
		const padding =
			(screen.width as number) -
			messageCount.length -
			modelInfo.length -
			4;

		bottomBar.setContent(
			`${" ".repeat(2)}${messageCount}${" ".repeat(
				padding
			)}${modelInfo}${" ".repeat(2)}`
		);

		screen.render();
	}

	// Handle focus and blur events to change border color
	inputBox.on("focus", () => {
		inputBox.style.border.fg = "green";
		screen.render();
	});

	inputBox.on("blur", () => {
		inputBox.style.border.fg = "white";
		screen.render();
	});

	// Handle message submission
	inputBox.on("submit", (value: string) => {
		if (value.trim()) {
			const userMessage = `[user]: ${value.trim()}`;
			chatBox.setContent(chatBox.getContent() + userMessage);

			// Simulate AI response
			setTimeout(() => {
				const aiResponse = `[${provider}]: This is a placeholder response`;
				chatBox.setContent(
					chatBox.getContent() + "\n" + aiResponse + "\n\n"
				);
				chatBox.scroll(chatBox.getScrollHeight());
				screen.render();
			}, 500);

			inputBox.clearValue();
			chatBox.scroll(chatBox.getScrollHeight());
			updateUI();
			inputBox.focus();
		}
		screen.render();
	});

	screen.append(topBar);
	screen.append(chatBox);
	screen.append(inputBox);
	screen.append(bottomBar);

	updateUI();

	screen.key(["escape"], () => {
		if (screen.focused === chatBox) {
			inputBox.focus();
			inputBox.style.border.fg = "green";
			chatBox.style.border.fg = "gray";
		}
		screen.render();
	});

	screen.key(["q", "C-c"], () => {
		return process.exit(0);
	});

	inputBox.focus(); // Set initial focus

	screen.render();
}
