# hbs-lint-vscode

VS Code extension for linting Handlebars templates in jsreport DOCX workflows.
See [SPECIFICATION.md](SPECIFICATION.md) for full feature spec.

## Tech Stack

- TypeScript, VS Code Extension API
- No runtime dependencies beyond vscode
- Regex-based parser (no Handlebars library dependency)

## Development

- `npm install` — install dependencies
- `npm run compile` — build
- `npm run watch` — incremental build
- `npm test` — run tests
- `F5` in VS Code — launch Extension Development Host

## Architecture

- `src/extension.ts` — activation, diagnostic wiring
- `src/parser/` — regex expression extractor with position tracking
- `src/rules/` — one file per rule, visitor pattern, no shared state
- `src/config/` — .hbslintrc.json loading and merging
- `src/schema/` — data schema loading and scope tracking

## Conventions

- One rule per file in `src/rules/`, named by code (e.g., `hbs001.ts`)
- Rules export a standard interface; no cross-rule dependencies
- Rule codes: HBS001-007 (Handlebars), DOCX001-004 (DOCX structure)
- Fixes classified as "safe" or "unsafe" — safe fixes auto-apply, unsafe require confirmation
- Package as .vsix for local install, no marketplace publishing
