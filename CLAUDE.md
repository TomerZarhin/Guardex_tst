# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guardex is a VSCode extension that provides real-time security scanning by detecting insecure coding patterns and displaying them as Diagnostics in the editor. It also provides a dashboard, code actions for quick fixes, and links to security guides.

## Commands

```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript to JavaScript
npm run watch        # Watch mode for development
npm run lint         # Run ESLint
npm test             # Run VSCode extension tests
```

## Architecture

### Entry Point
**`src/extension.ts`** - Main extension entry that:
- Registers all VSCode commands (dashboard, security guide, run full scan)
- Sets up auto-scanning via `onDidOpenTextDocument` and `onDidChangeTextDocument` with 300ms debounce
- Creates the diagnostic collection and listens for diagnostic changes to update the dashboard
- Registers CodeActionProviders for quick fixes

### Security Rules
Rules are defined in **`src/diagnostics/rules/`**. Each rule exports a `SecurityRule` object:

```typescript
{
  id: string,           // Unique identifier (e.g., "sql-injection")
  description: string, // Message shown to user
  severity: vscode.DiagnosticSeverity, // Error, Warning, or Info
  regex: RegExp,        // Pattern to detect
  relatedInfo?: {       // Optional documentation link
    url: string,
    message: string
  }
}
```

**`src/diagnostics/types.ts`** defines the `SecurityRule` interface.

**Adding a new rule:**
1. Create a new file in `src/diagnostics/rules/`
2. Export the rule object and optionally a CodeActionProvider class
3. Import and add the rule to the array in `src/diagnostics/rules/allRules.ts`

### Rule Execution
**`src/diagnostics/ruleManager.ts`** - `runAllRules()` iterates through all rules, runs their regex against the document text, and creates VSCode Diagnostics for each match. It attaches the `relatedUrl` to diagnostics for the security report view.

### Dashboard
**`src/dashboard.ts`** - TreeDataProvider that lists all findings grouped by file with severity icons.

**`src/securityReport.ts`** - WebView panel showing detailed info when a finding is clicked.

### Auto-Scanning
The extension activates on JavaScript, TypeScript, and Python files. It scans on document open or edit (debounced 300ms) and updates the VSCode Diagnostics collection.

## Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Main entry point, registers commands and auto-scan |
| `src/diagnostics/ruleManager.ts` | Runs all rules, produces Diagnostics |
| `src/diagnostics/rules/allRules.ts` | Registry of all security rules |
| `src/diagnostics/types.ts` | SecurityRule interface definition |
| `src/dashboard.ts` | TreeView dashboard provider |
| `src/securityReport.ts` | WebView for detailed findings |
| `package.json` | Extension configuration, commands, activation events |

## Supported Languages

JavaScript, TypeScript, and Python (configured in `activationEvents` and `scanDocument` check).