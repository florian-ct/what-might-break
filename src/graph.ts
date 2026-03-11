import { getImports } from "./parser";

export interface BlastRadius {
	direct: number;
	indirect: number;
	total: number;
}

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

export function computeBlastRadii(
	graph: Map<string, Set<string>>,
): Map<string, BlastRadius> {
	const result = new Map<string, BlastRadius>();

	for (const file of graph.keys()) {
		const directSet = graph.get(file)!;
		const visited = new Set<string>();

		const queue: string[] = [...directSet];
		for (const node of queue) {
			if (visited.has(node)) continue;
			visited.add(node);
			for (const next of graph.get(node) ?? []) {
				if (!visited.has(next)) queue.push(next);
			}
		}

		const direct = directSet.size;
		const total = visited.size;
		result.set(file, { direct, indirect: total - direct, total });
	}

	return result;
}
