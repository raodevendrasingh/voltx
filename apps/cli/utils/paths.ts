import os from "os";
import path from "path";
import { readFileSync } from "fs";

export const BASE_DIR = path.join(os.homedir(), ".voltx");
export const CONFIG_PATH = path.join(BASE_DIR, "config.toml");
export const CHATS_DIR = path.join(BASE_DIR, "chats");
export const LOGS_DIR = path.join(BASE_DIR, "logs");
export const TEMP_DIR = path.join(BASE_DIR, "temp");
export const CACHE_DIR = path.join(BASE_DIR, "cache");
