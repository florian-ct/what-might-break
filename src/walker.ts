import * as fs from "fs";
import * as path from "path";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

export function getFiles(rootPath: string): string[] {
	const stat = fs.statSync(rootPath);
	if (stat.isFile()) {
		return [path.resolve(rootPath)];
	}
	const results: string[] = [];
	walk(rootPath, results);
	return results;
}

function walk(dir: string, results: string[]): void {
	for (const entry of fs.readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const fullPath = path.join(dir, entry);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			walk(fullPath, results);
		} else if (EXTENSIONS.has(path.extname(entry))) {
			results.push(fullPath);
		}
	}
}
