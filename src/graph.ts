import { getImports } from "./parser";

export function buildGraph(files: string[]): Map<string, Set<string>> {
	const fileSet = new Set(files);
	const graph = new Map<string, Set<string>>();

	for (const file of files) {
		if (!graph.has(file)) graph.set(file, new Set());

		for (const imported of getImports(file)) {
			if (!fileSet.has(imported)) continue;
			if (!graph.has(imported)) graph.set(imported, new Set());
			graph.get(imported)!.add(file);
		}
	}

	return graph;
}
