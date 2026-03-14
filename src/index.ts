#!/usr/bin/env node
import { Command } from "commander";
import * as path from "path";
import {
	analyzeCode,
	FileResult,
	getChain,
	getInsight,
	ChainNode,
} from "./analysis";

function renderTree(node: ChainNode, cwd: string): string {
	const lines: string[] = [];

	function walk(
		n: ChainNode,
		prefix: string,
		isLast: boolean,
		isRoot: boolean,
	): void {
		if (isRoot) {
			lines.push(path.relative(cwd, n.file));
		} else {
			const connector = isLast ? "└── " : "├── ";
			const cyclicMark = n.cyclic ? " (cyclic)" : "";
			lines.push(
				`${prefix}${connector}${path.relative(cwd, n.file)}${cyclicMark}`,
			);
		}
		if (n.children.length > 0) {
			const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
			n.children.forEach((child, i) => {
				walk(child, childPrefix, i === n.children.length - 1, false);
			});
		}
	}

	walk(node, "", true, true);
	return lines.join("\n");
}

const program = new Command();

program
	.name("what-might-break")
	.description("Analyze code for potential breaking points")
	.version("1.0.0");

program
	.command("analyze <targetPath>")
	.description("Analyze a file or directory")
	.option("--top <n>", "limit results to top N files", "10")
	.option("--format <fmt>", "output format: table or json", "table")
	.option(
		"--ignore <pattern>",
		"glob pattern to ignore, e.g. '**/*.test.ts' (can be repeated)",
		(val: string, prev: string[]) => [...prev, val],
		[] as string[],
	)
	.action(
		(
			targetPath: string,
			options: { top: string; format: string; ignore: string[] },
		) => {
			const results = analyzeCode(
				targetPath,
				parseInt(options.top, 10),
				options.ignore,
			);

			if (results.length === 0) {
				console.log("No dependencies found.");
				return;
			}

			if (options.format === "json") {
				const cwd = process.cwd();
				console.log(
					JSON.stringify(
						results.map((r) => ({
							file: path.relative(cwd, r.file),
							directDependants: r.directDependants,
							indirectDependants: r.indirectDependants,
							blastRadius: r.blastRadius,
							impactScore: Math.round(r.impactScore * 10) / 10,
							insight: getInsight(r),
						})),
						null,
						2,
					),
				);
				return;
			}

			const cwd = process.cwd();
			const rankWidth = 4;
			const impactWidth = 8;
			const fileWidth =
				Math.max(...results.map((r) => path.relative(cwd, r.file).length), 4) +
				2;

			console.log(
				`${"Rank".padEnd(rankWidth)}  ${"Impact".padEnd(impactWidth)}  ${"File".padEnd(fileWidth)}  Blast Radius`,
			);
			console.log(
				"-".repeat(rankWidth + 2 + impactWidth + 2 + fileWidth + 2 + 20),
			);

			results.forEach((r: FileResult, i: number) => {
				const rank = String(i + 1).padEnd(rankWidth);
				const impact = `${Math.round(r.impactScore * 10) / 10}%`.padEnd(
					impactWidth,
				);
				const file = path.relative(cwd, r.file).padEnd(fileWidth);
				const blast = `${r.blastRadius} (${r.directDependants} direct, ${r.indirectDependants} indirect)`;
				console.log(`${rank}  ${impact}  ${file}  ${blast}`);
			});

			console.log();
			console.log("Insights:");
			results.forEach((r: FileResult, i: number) => {
				const label = path.relative(cwd, r.file);
				console.log(`  [${i + 1}] ${label}: ${getInsight(r)}`);
			});
		},
	);

program
	.command("chain <file>")
	.description("Show the full dependency chain for a specific file")
	.option("--root <dir>", "root directory to scan", process.cwd())
	.option(
		"--ignore <pattern>",
		"glob pattern to ignore, e.g. '**/*.test.ts' (can be repeated)",
		(val: string, prev: string[]) => [...prev, val],
		[] as string[],
	)
	.action((file: string, options: { root: string; ignore: string[] }) => {
		const result = getChain(file, options.root, options.ignore);
		if (!result) {
			console.error(`File not found in graph: ${file}`);
			console.error(
				`Make sure the file exists and is within --root (default: current directory)`,
			);
			process.exit(1);
		}

		const cwd = process.cwd();
		const relFile = path.relative(cwd, result.file);

		console.log(`Dependency chain for: ${relFile}`);
		console.log("=".repeat(40));

		console.log();
		console.log("Dependencies (what this file imports):");
		if (result.dependencyTree.children.length === 0) {
			console.log("  (no local imports)");
		} else {
			console.log(renderTree(result.dependencyTree, cwd));
		}

		console.log();
		console.log("Dependants (files that would break if this changes):");
		if (result.dependantTree.children.length === 0) {
			console.log("  (no files import this)");
		} else {
			console.log(renderTree(result.dependantTree, cwd));
		}
	});

program.parse(process.argv);
