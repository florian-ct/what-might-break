import * as fs from "fs";
import * as path from "path";

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export function getImports(filePath: string): string[] {
	const content = fs.readFileSync(filePath, "utf-8");
	const dir = path.dirname(filePath);

	return extractImportPaths(content)
		.filter((p) => p.startsWith("./") || p.startsWith("../"))
		.map((p) => resolveImport(dir, p))
		.filter((p): p is string => p !== null);
}

function extractImportPaths(content: string): string[] {
	const results: string[] = [];
	let match: RegExpExecArray | null;

	// static imports: import ... from 'X'
	const staticImport = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
	while ((match = staticImport.exec(content)) !== null) {
		results.push(match[1]);
	}

	// dynamic imports: import('X')
	const dynamicImport = /import\(['"]([^'"]+)['"]\)/g;
	while ((match = dynamicImport.exec(content)) !== null) {
		results.push(match[1]);
	}

	// require calls: require('X')
	const requireCall = /require\(['"]([^'"]+)['"]\)/g;
	while ((match = requireCall.exec(content)) !== null) {
		results.push(match[1]);
	}

	return results;
}

function resolveImport(dir: string, importPath: string): string | null {
	const base = path.resolve(dir, importPath);

	if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

	for (const ext of EXTENSIONS) {
		const candidate = base + ext;
		if (fs.existsSync(candidate)) return candidate;
	}

	for (const ext of EXTENSIONS) {
		const candidate = path.join(base, "index" + ext);
		if (fs.existsSync(candidate)) return candidate;
	}

	return null;
}
