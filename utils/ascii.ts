import chalk from "chalk";
import figlet from "figlet";

export const showBanner = () => {
	console.log("");
	console.log(
		chalk.greenBright(
			figlet.textSync("volt", {
				horizontalLayout: "default",
				font: "Big Money-nw",
				showHardBlanks: false,
			})
		)
	);
};
