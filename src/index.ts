#!/usr/bin/env node
import { Command } from "commander";
import * as path from "path";
import { analyzeCode, FileResult } from "./analysis";

const program = new Command();

program
	.name("what-might-break")
	.description("Analyze code for potential breaking points")
	.version("1.0.0");

program
	.command("analyze <targetPath>")
	.description("Analyze a file or directory")
	.option("--top <n>", "limit results to top N files", "10")
	.action((targetPath: string, options: { top: string }) => {
		const results = analyzeCode(targetPath, parseInt(options.top, 10));

		if (results.length === 0) {
			console.log("No dependencies found.");
			return;
		}

		const cwd = process.cwd();
		const rankWidth = 4;
		const fileWidth =
			Math.max(...results.map((r) => path.relative(cwd, r.file).length), 4) + 2;

		console.log(
			`${"Rank".padEnd(rankWidth)}  ${"File".padEnd(fileWidth)}  Blast Radius`,
		);
		console.log("-".repeat(rankWidth + 2 + fileWidth + 2 + 20));

		results.forEach((r: FileResult, i: number) => {
			const rank = String(i + 1).padEnd(rankWidth);
			const file = path.relative(cwd, r.file).padEnd(fileWidth);
			const blast = `${r.blastRadius} (${r.directDependants} direct, ${r.indirectDependants} indirect)`;
			console.log(`${rank}  ${file}  ${blast}`);
		});
	});

program.parse(process.argv);
