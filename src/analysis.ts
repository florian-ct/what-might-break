import * as path from "path";
import { getFiles } from "./walker";
import {
	buildGraph,
	buildImportsGraph,
	buildDependantTree,
	buildDependencyTree,
	computeBlastRadii,
	ChainNode,
} from "./graph";

export type { ChainNode };

export interface FileResult {
	file: string;
	directDependants: number;
	indirectDependants: number;
	blastRadius: number;
	impactScore: number; // blastRadius as % of total files in the graph
}

export function analyzeCode(
	rootPath: string,
	top: number,
	ignorePatterns: string[] = [],
): FileResult[] {
	const absolutePath = path.resolve(rootPath);
	const files = getFiles(absolutePath, ignorePatterns);
	const graph = buildGraph(files);
	const radii = computeBlastRadii(graph);
	const totalFiles = graph.size;

	const results: FileResult[] = [];
	for (const [file] of graph.entries()) {
		const radius = radii.get(file)!;
		results.push({
			file,
			directDependants: radius.direct,
			indirectDependants: radius.indirect,
			blastRadius: radius.total,
			impactScore: totalFiles > 0 ? (radius.total / totalFiles) * 100 : 0,
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

export interface DependencyChainResult {
	file: string;
	dependantTree: ChainNode;
	dependencyTree: ChainNode;
}

export function getChain(
	targetFile: string,
	rootPath: string,
	ignorePatterns: string[] = [],
): DependencyChainResult | null {
	const absoluteTarget = path.resolve(targetFile);
	const absoluteRoot = path.resolve(rootPath);
	const files = getFiles(absoluteRoot, ignorePatterns);

	if (!files.includes(absoluteTarget)) return null;

	const dependantsGraph = buildGraph(files);
	const importsGraph = buildImportsGraph(files);

	return {
		file: absoluteTarget,
		dependantTree: buildDependantTree(absoluteTarget, dependantsGraph),
		dependencyTree: buildDependencyTree(absoluteTarget, importsGraph),
	};
}

export function getInsight(result: FileResult): string {
	const { impactScore, directDependants, indirectDependants, blastRadius } =
		result;

	if (blastRadius === 0) {
		return "No other files depend on this — safe to change with no ripple effect.";
	}

	const parts: string[] = [];

	if (impactScore > 50) {
		parts.push(
			`Critical core module — changes here will cascade through ${blastRadius} files (${Math.round(impactScore)}% of the project). Treat any interface change as a major breaking change.`,
		);
	} else if (impactScore > 25) {
		parts.push(
			`High-risk change — affects ${blastRadius} files (${Math.round(impactScore)}% of the project). Write comprehensive tests before modifying.`,
		);
	} else if (impactScore > 10) {
		parts.push(
			`Moderate risk — changes will ripple through ${blastRadius} file${blastRadius === 1 ? "" : "s"}. Review all dependants before shipping.`,
		);
	} else {
		parts.push(
			`Low risk — changes affect ${blastRadius} file${
				blastRadius === 1 ? "" : "s"
			} in total. Verify those files still compile.`,
		);
	}

	if (directDependants > 0 && indirectDependants > 0) {
		parts.push(
			`${directDependants} file${
				directDependants === 1 ? "" : "s"
			} directly import${directDependants === 1 ? "s" : ""} this; breaking changes will also indirectly affect ${indirectDependants} more.`,
		);
	} else if (directDependants > 0) {
		parts.push(
			`${directDependants} file${
				directDependants === 1 ? " directly imports" : "s directly import"
			} this.`,
		);
	}

	return parts.join(" ");
}
