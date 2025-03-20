import path from "path";
import os from "os";

export const CONFIG_DIR = path.join(os.homedir(), ".system-cli");
export const PROFILE_PATH = path.join(CONFIG_DIR, "profile.json");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
export const CHATS_DIR = path.join(CONFIG_DIR, "chats");
