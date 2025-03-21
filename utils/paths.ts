import os from "os";
import path from "path";
import { readFileSync } from "fs";

export const BASE_DIR = path.join(os.homedir(), ".system-cli");
export const CONFIG_PATH = path.join(BASE_DIR, "config.toml");
export const CHATS_DIR = path.join(BASE_DIR, "chats");
export const LOGS_DIR = path.join(BASE_DIR, "logs");
export const TEMP_DIR = path.join(BASE_DIR, "temp");
export const CACHE_DIR = path.join(BASE_DIR, "cache");

export const PACKAGE_JSON_PATH = path.join(process.cwd(), "package.json");
export const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
