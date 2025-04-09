import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["bin/index.ts"],
	format: ["esm"],
	target: "node18",
	outDir: "dist",
	clean: true,
	banner: {
		js: "#!/usr/bin/env node",
	},
});
