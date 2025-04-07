import chalk from "chalk";
import figlet from "figlet";

export const showBanner = () => {
	console.log("");
	console.log(
		chalk.greenBright(
			figlet.textSync("voltx", {
				horizontalLayout: "default",
				font: "Big Money-nw",
				showHardBlanks: false,
			})
		)
	);
};
