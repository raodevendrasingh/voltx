import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
	build: {
		lib: {
			entry: "./bin/index.ts",
			formats: ["es"],
			fileName: "index",
		},
		rollupOptions: {
			external: [
				"react",
				"react-dom",
				"blessed",
				"chalk",
				"commander",
				"dotenv",
				"figlet",
				"ink",
				"inquirer",
				"openai",
			],
		},
	},
});
