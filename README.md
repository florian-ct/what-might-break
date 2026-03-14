# what-might-break

Analyze your codebase to understand what will break before you touch anything.

## How it works

`what-might-break` walks your JS/TS project, parses every `import`/`require` statement, and builds a dependency graph. It then ranks each file by how many other files depend on it — the higher the rank, the more likely touching it will cause a ripple effect.

## Usage

```bash
# Build
npm run build

# Analyze a directory
node dist/index.js analyze <path> [--top <n>] [--format json] [--ignore <pattern>]

# Show the full dependency chain for a specific file
node dist/index.js chain <file> [--root <dir>] [--ignore <pattern>]

# Examples
node dist/index.js analyze ./src
node dist/index.js analyze ./src --top 5
node dist/index.js analyze ./src --format json
node dist/index.js analyze ./src --ignore '**/*.test.ts'
node dist/index.js analyze ./src --ignore '**/*.test.ts' --ignore '**/*.spec.ts'
node dist/index.js chain ./src/parser.ts
node dist/index.js chain ./src/parser.ts --root ./src --ignore '**/*.test.ts'
```

### Output

```
Rank  Impact    File               Blast Radius
-------------------------------------------------------
1     60%       src/parser.ts      3 (1 direct, 2 indirect)
2     40%       src/walker.ts      2 (1 direct, 1 indirect)
3     40%       src/graph.ts       2 (1 direct, 1 indirect)

Insights:
  [1] src/parser.ts: Critical core module — changes here will cascade through 3 files (60% of the project). Treat any interface change as a major breaking change. 1 file directly imports this; breaking changes will also indirectly affect 2 more.
  [2] src/walker.ts: High-risk change — affects 2 files (40% of the project). Write comprehensive tests before modifying. ...
```

#### `chain` output

```
Dependency chain for: src/parser.ts
========================================

Dependencies (what this file imports):
  (no local imports)

Dependants (files that would break if this changes):
src/parser.ts
└── src/graph.ts
    └── src/analysis.ts
        └── src/index.ts
```

## MVP checklist

- [x] User can run the tool on their codebase via the CLI
- [x] User can specify a file or directory to analyze
- [x] Tool outputs a ranked list of the most depended-on files

## Next steps

- [x] Configurable ignore patterns (e.g. skip test files)
- [x] JSON output mode (`--format json`) for CI/programmatic use
- [x] Show the full dependency chain for a specific file
- [x] % impact score alongside raw dependant count
- [x] Practical insights on potential breakage (e.g. "This file is a critical dependency for 12 other files, including 3 in production code.")
- [x] Calculate and display the "ripple effect" of changes to a file (e.g. "Changing this file would affect 12 direct dependants and 30 indirect dependants."), ie. the blast radius.
