# hbs-lint-vscode Specification

VS Code extension for linting Handlebars templates in jsreport DOCX workflows.

## Purpose

Catch Handlebars errors and DOCX template corruption before they hit jsreport rendering. Primary users: a small GIS/environmental consulting team maintaining jsreport DOCX templates with Handlebars expressions embedded in Word XML.

## File Activation

- `.hbs`, `.handlebars` files
- Files inside jsreport `templates/` and `data/` directories
- Any file containing both `{{` and `<w:` (DOCX template XML)

## Rule System

Each rule has a unique code, severity, and optional fix. Rules are independent modules following a visitor pattern — one file per rule, standard interface, no shared state.

### Rule Codes

| Code    | Severity | Rule                                                    | Fixable |
| ------- | -------- | ------------------------------------------------------- | ------- |
| HBS001  | error    | Mismatched block closer (`{{#if}}...{{/unless}}`)       | unsafe  |
| HBS002  | error    | Unclosed block helper                                   | no      |
| HBS003  | warning  | Unknown helper (not in registry)                        | no      |
| HBS004  | warning  | Unknown sub-expression helper                           | no      |
| HBS005  | info     | Field not found in data schema                          | no      |
| HBS006  | warning  | `{{#each}}` on a non-array field                        | no      |
| HBS007  | warning  | Accessing child field that doesn't exist on parent type | no      |
| DOCX001 | error    | Expression split across `<w:r>` runs                    | unsafe  |
| DOCX002 | warning  | `<w:proofErr>` markup near expression                   | safe    |
| DOCX003 | info     | Revision tracking (rsid) near expression                | safe    |
| DOCX004 | info     | Block helper spans table row boundaries                 | no      |

### Fix Safety

- **Safe**: applying the fix cannot change template meaning (e.g., stripping `<w:proofErr>` tags, removing rsid attributes)
- **Unsafe**: fix may misidentify boundaries or alter structure (e.g., reconstituting run-split expressions, swapping a block closer)
- "Fix all" applies only safe fixes. Unsafe fixes require individual "Quick fix" confirmation.

## Inline Suppression

Use Handlebars comments to suppress rules per-line or per-block:

```handlebars
{{! hbs-lint-disable DOCX001 }}
{{! hbs-lint-disable DOCX001 HBS003 }}
{{! hbs-lint-disable-next-line HBS005 }}
```

## Configuration

Workspace config via `.hbslintrc.json` at project root:

```json
{
  "helpers": ["each", "if", "unless", "with", "formatDate", "padZero"],
  "schemaFile": "./data/schema.json",
  "docxMode": true,
  "lintOn": "save",
  "rules": {
    "DOCX001": "error",
    "HBS005": "off"
  },
  "overrides": [
    {
      "files": ["**/partials/**"],
      "rules": { "DOCX001": "off" }
    }
  ]
}
```

- `helpers`: registered helper names (beyond builtins)
- `schemaFile`: path to a typed data schema (see Data Schema below).
- `docxMode`: enable DOCX-specific rules (DOCX001-004). Default: auto-detect from file content.
- `lintOn`: `"save"` (default) or `"type"` (debounced)
- `rules`: per-rule severity override (`"error"`, `"warn"`, `"info"`, `"off"`)
- `overrides`: file-pattern-based rule overrides

## Data Schema

The schema file defines the shape of the data payload passed to jsreport. The linter uses it to validate field references, detect `{{#each}}` on non-arrays, and verify child field access inside block scopes.

### Schema Format

Example schema illustrating the type conventions (not a real project schema):

```json
{
  "siteId": "string",
  "inspectionDate": "string",
  "inspector": "string",
  "samples": [
    {
      "depth": "number",
      "colorCode": "string",
      "textureClass": "string",
      "hasFinds": "boolean",
      "notes": "string"
    }
  ],
  "attachments": [
    {
      "url": "string",
      "caption": "string"
    }
  ],
  "coordinates": {
    "latitude": "number",
    "longitude": "number",
    "datum": "string"
  }
}
```

### Type Conventions

- `"string"`, `"number"`, `"boolean"` — leaf scalars
- `[{...}]` — array of objects (valid `{{#each}}` target)
- `{...}` — nested object (valid `{{#with}}` target, not valid `{{#each}}` target)
- `["string"]` — array of scalars (valid `{{#each}}`, items accessed via `{{this}}`)

### Scope Tracking

The linter must track scope as it walks expressions:

1. At root, valid fields are top-level keys (`siteId`, `samples`, `coordinates`, etc.)
2. Inside `{{#each samples}}`, valid fields are children of `samples[0]` (`depth`, `colorCode`, etc.) plus `@index`, `@first`, `@last`, `@key`
3. Inside `{{#with coordinates}}`, valid fields are children of `coordinates` (`latitude`, `longitude`, `datum`)
4. `../` references walk one scope level up
5. `this` refers to the current context item

### Validation Rules

- **HBS005**: A referenced field doesn't exist at the current scope level
- **HBS006**: `{{#each field}}` where `field` is an object or scalar, not an array
- **HBS007**: `{{child}}` inside `{{#each parent}}` where `child` is not a defined key on items in `parent`

### Schema Generation

The schema file can be authored manually or generated from:

- A sample JSON data payload (`hbs-lint: Generate Schema from JSON` command)
- A jsreport `/data/` folder sample file

The generator infers types from values and wraps repeated structures in arrays. It should produce a draft that the user then reviews and commits.

## Diagnostics

- Use VS Code `DiagnosticCollection` for inline squiggles and Problems panel integration
- Each diagnostic includes rule code as a clickable link to documentation
- Register `source.fixAll.hbsLint` for fix-on-save support
- Provide a "hbs-lint: Lint Workspace" command for aggregate diagnostics across all templates

## Parser

Lightweight regex-based expression extractor (no Handlebars dependency). Must handle:

- `{{expr}}`, `{{{raw}}}`, `{{#block}}...{{/block}}`, `{{>partial}}`, `{{!comment}}`
- Hash arguments: `{{helper key=value}}`
- Sub-expressions: `{{helper (sub arg)}}`
- Position tracking: line and column for each expression

Upgrade path: swap in `Handlebars.parse()` for full AST if edge cases demand it.

## Distribution

Package as `.vsix` for local team install. No marketplace publishing required initially.
