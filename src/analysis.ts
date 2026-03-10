import * as path from "path";
import { getFiles } from "./walker";
import { buildGraph } from "./graph";

export interface FileResult {
	file: string;
	dependants: number;
}

export function analyzeCode(rootPath: string, top: number): FileResult[] {
	const absolutePath = path.resolve(rootPath);
	const files = getFiles(absolutePath);
	const graph = buildGraph(files);

	const results: FileResult[] = [];
	for (const [file, importers] of graph.entries()) {
		results.push({ file, dependants: importers.size });
	}

	return results.sort((a, b) => b.dependants - a.dependants).slice(0, top);
}
