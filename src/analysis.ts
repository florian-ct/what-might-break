import * as path from "path";
import { getFiles } from "./walker";
import { buildGraph, computeBlastRadii } from "./graph";

export interface FileResult {
	file: string;
	directDependants: number;
	indirectDependants: number;
	blastRadius: number;
}

export function analyzeCode(rootPath: string, top: number): FileResult[] {
	const absolutePath = path.resolve(rootPath);
	const files = getFiles(absolutePath);
	const graph = buildGraph(files);
	const radii = computeBlastRadii(graph);

	const results: FileResult[] = [];
	for (const [file] of graph.entries()) {
		const radius = radii.get(file)!;
		results.push({
			file,
			directDependants: radius.direct,
			indirectDependants: radius.indirect,
			blastRadius: radius.total,
		});
	}

	return results
		.sort(
			(a, b) =>
				b.blastRadius - a.blastRadius ||
				b.directDependants - a.directDependants,
		)
		.slice(0, top);
}
