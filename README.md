# what-might-break

Analyze your codebase to understand what will break before you touch anything.

## How it works

`what-might-break` walks your JS/TS project, parses every `import`/`require` statement, and builds a dependency graph. It then ranks each file by how many other files depend on it — the higher the rank, the more likely touching it will cause a ripple effect.

## Usage

```bash
# Build
npm run build

# Analyze a directory
node dist/index.js analyze <path> [--top <n>]

# Examples
node dist/index.js analyze ./src
node dist/index.js analyze ./src --top 5
```

### Output

```
Rank  Dependants  File
------------------------------------------------------------
1     12          src/utils/auth.ts
2     9           src/db/client.ts
3     4           src/lib/logger.ts
```

## MVP checklist

- [x] User can run the tool on their codebase via the CLI
- [x] User can specify a file or directory to analyze
- [x] Tool outputs a ranked list of the most depended-on files

## Next steps

- [ ] Configurable ignore patterns (e.g. skip test files)
- [ ] JSON output mode (`--format json`) for CI/programmatic use
- [ ] Show the full dependency chain for a specific file
- [ ] % impact score alongside raw dependant count
- [ ] Practical insights on potential breakage (e.g. "This file is a critical dependency for 12 other files, including 3 in production code.")
- [ ] Calculate and display the "ripple effect" of changes to a file (e.g. "Changing this file would affect 12 direct dependants and 30 indirect dependants."), ie. the blast radius.
