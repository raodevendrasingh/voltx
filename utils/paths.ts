import path from "path";
import os from "os";
import { readFileSync } from "fs";

export const CONFIG_DIR = path.join(os.homedir(), ".system-cli");
export const PROFILE_PATH = path.join(CONFIG_DIR, "profile.json");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
export const CHATS_DIR = path.join(CONFIG_DIR, "chats");
export const LOGS_DIR = path.join(CONFIG_DIR, "logs");
export const TEMP_DIR = path.join(CONFIG_DIR, "temp");
export const MODELS_CACHE_PATH = path.join(CONFIG_DIR, "models-cache.json");

export const PACKAGE_JSON_PATH = path.join(process.cwd(), "package.json");
export const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
