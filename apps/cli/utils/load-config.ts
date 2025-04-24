import TOML from "@iarna/toml";
import { readFileSync } from "fs";
import { CONFIG_PATH } from "./paths";
import { VoltxConfig } from "./types";

const rawToml = readFileSync(CONFIG_PATH, "utf-8");
const parsedConfig = TOML.parse(rawToml);

const config = parsedConfig as unknown as VoltxConfig;

export default config;
