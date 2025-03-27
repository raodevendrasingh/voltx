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

	updateUI();

	screen.append(topBar);
	screen.append(bottomBar);

	screen.key(["escape", "q", "C-c"], function (ch, key) {
		return process.exit(0);
	});

	screen.render();
}
