# HBS Lint for VS Code

VS Code extension for linting Handlebars templates in jsreport DOCX workflows. Catches Handlebars errors and DOCX template corruption before they hit jsreport rendering.

## Features

- **Handlebars validation** — mismatched block closers, unclosed blocks, unknown helpers, field verification against a data schema
- **DOCX-aware rules** — detects expressions split across Word XML runs, spell-check artifacts, and revision tracking noise
- **Quick fixes** — safe fixes auto-apply on save; unsafe fixes require confirmation
- **Inline suppression** — disable rules per-line or per-block with `{{! hbs-lint-disable RULE }}` comments
- **Workspace config** — `.hbslintrc.json` for helper registration, schema paths, per-rule severity, and file-pattern overrides
- **Schema-driven** — validate field references, `{{#each}}` targets, and nested scope access against a typed data schema

## Rules

| Code | Severity | Description |
|---------|----------|--------------------------------------------------|
| HBS001 | error | Mismatched block closer |
| HBS002 | error | Unclosed block helper |
| HBS003 | warning | Unknown helper (not in registry) |
| HBS004 | warning | Unknown sub-expression helper |
| HBS005 | info | Field not found in data schema |
| HBS006 | warning | `{{#each}}` on a non-array field |
| HBS007 | warning | Child field doesn't exist on parent type |
| DOCX001 | error | Expression split across `<w:r>` runs |
| DOCX002 | warning | `<w:proofErr>` markup near expression |
| DOCX003 | info | Revision tracking (rsid) near expression |
| DOCX004 | info | Block helper spans table row boundaries |

## Getting Started

### Prerequisites

- VS Code 1.85+
- Node.js 20+

### Install from Source

```bash
npm install
npm run compile
npm run package
```

Install the generated `.vsix` file: **Extensions** > **...** > **Install from VSIX**.

### Configuration

Create a `.hbslintrc.json` in your project root:

```json
{
  "helpers": ["formatDate", "padZero"],
  "schemaFile": "./data/schema.json",
  "docxMode": true,
  "lintOn": "save",
  "rules": {
    "DOCX001": "error",
    "HBS005": "off"
  }
}
```

### Data Schema

Define the shape of your jsreport data payload to enable field validation (HBS005-007):

```json
{
  "siteId": "string",
  "samples": [
    {
      "depth": "number",
      "colorCode": "string"
    }
  ],
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

Generate a schema from a sample JSON file using the **hbs-lint: Generate Schema from JSON** command.

## Development

```bash
npm install
npm run compile     # build
npm run watch       # incremental build
npm test            # run tests
```

Press **F5** in VS Code to launch the Extension Development Host.

## Architecture

```
src/
  extension.ts       — activation and diagnostic wiring
  parser/            — regex-based expression extractor with position tracking
  rules/             — one file per rule, visitor pattern
  config/            — .hbslintrc.json loading and merging
  schema/            — data schema loading and scope tracking
  commands/          — VS Code command handlers
```

## License

Private — internal use only.
