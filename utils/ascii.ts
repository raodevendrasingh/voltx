import chalk from "chalk";
import figlet from "figlet";

export const showBanner = () => {
	console.log(
		chalk.yellow(
			figlet.textSync("System CLI", { horizontalLayout: "default" })
		)
	);
};

export const showAsciiArt = () => {
	console.log(
		chalk.green(
			figlet.textSync("System CLI", { horizontalLayout: "default" })
		)
	);
};
