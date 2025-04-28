import ignore from "ignore";
import path from "path";
import fs from "fs";
import { log } from "@clack/prompts";

function _findGitIgnore(startDir: string): string | null {
	let currentDir = startDir;
	while (true) {
		const gitignorePath = path.join(currentDir, ".gitignore");
		if (fs.existsSync(gitignorePath)) {
			return gitignorePath;
		}
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			return null;
		}
		currentDir = parentDir;
	}
}

export function generateDirectoryTree(
	dir: string,
	maxDepth: number = 3,
	indent: string = "",
	currentDepth: number = 0,
	ig: any = null,
): string {
	if (currentDepth > maxDepth) {
		return indent + "...\n";
	}

	let tree = "";
	let files: string[];

	if (ig === null && currentDepth === 0) {
		ig = ignore();
		const gitignorePath = _findGitIgnore(dir);
		if (gitignorePath) {
			try {
				const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
				ig.add(gitignoreContent);
			} catch (err) {
				log.warning(`Could not read .gitignore at ${gitignorePath}`);
			}
		}
		ig.add(".git");
	}

	try {
		files = fs.readdirSync(dir);
	} catch (err) {
		// Handle cases where directory might not be readable
		return indent + `[Error reading directory: ${path.basename(dir)}]\n`;
	}

	// Filter files based on ignore rules relative to the *original* start directory
	const relativeDirPath = path.relative(process.cwd(), dir);
	const filteredFiles = files.filter((file) => {
		const relativeFilePath = path.join(relativeDirPath, file);
		// Add a trailing slash for directories to match gitignore behavior
		const checkPath = fs.statSync(path.join(dir, file)).isDirectory()
			? relativeFilePath + "/"
			: relativeFilePath;
		return !ig.ignores(checkPath);
	});

	filteredFiles.forEach((file, index) => {
		const filePath = path.join(dir, file);
		const isLast = index === filteredFiles.length - 1;
		const connector = isLast ? "└── " : "├── ";
		const line = indent + connector + file + "\n";
		tree += line;

		try {
			const stats = fs.statSync(filePath);
			if (stats.isDirectory()) {
				const newIndent = indent + (isLast ? "    " : "│   ");
				tree += generateDirectoryTree(
					filePath,
					maxDepth,
					newIndent,
					currentDepth + 1,
					ig, // Pass the same ignore instance down
				);
			}
		} catch (err) {
			// Handle potential stat errors (e.g., broken symlinks)
			tree += indent + (isLast ? "    " : "│   ") + "[Error accessing]\n";
		}
	});

	// Limit overall tree size (optional, adjust as needed)
	if (tree.length > 5000 && currentDepth === 0) {
		tree = tree.substring(0, 5000) + "\n... [Tree truncated due to size]";
	}

	return tree;
}
