import * as fs from "fs";
import * as path from "path";
import { minimatch } from "minimatch";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

function isIgnored(relativePath: string, ignorePatterns: string[]): boolean {
	return ignorePatterns.some((pattern) =>
		minimatch(relativePath, pattern, { dot: true }),
	);
}

export function getFiles(
	rootPath: string,
	ignorePatterns: string[] = [],
): string[] {
	const stat = fs.statSync(rootPath);
	if (stat.isFile()) {
		const rel = path.basename(rootPath);
		if (isIgnored(rel, ignorePatterns)) return [];
		return [path.resolve(rootPath)];
	}
	const results: string[] = [];
	walk(rootPath, results, rootPath, ignorePatterns);
	return results;
}

function walk(
	dir: string,
	results: string[],
	rootPath: string,
	ignorePatterns: string[],
): void {
	for (const entry of fs.readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const fullPath = path.join(dir, entry);
		const relativePath = path.relative(rootPath, fullPath);
		if (isIgnored(relativePath, ignorePatterns)) continue;
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			walk(fullPath, results, rootPath, ignorePatterns);
		} else if (EXTENSIONS.has(path.extname(entry))) {
			results.push(fullPath);
		}
	}
}
