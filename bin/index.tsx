#!/usr/bin/env node
import { program } from "commander";
import { spawn } from "child_process";

program
	.command("init")
	.description("Initialize configuration")
	.action(() => {
		spawn("npx", ["tsx", "bin/init.tsx"], { stdio: "inherit" });
	});

program.parse(process.argv);
