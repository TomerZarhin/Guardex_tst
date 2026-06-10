# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guardex is a VSCode extension providing real-time security scanning by detecting insecure coding patterns and displaying them as Diagnostics in the editor. It includes a dashboard, code actions for quick fixes, and links to security guides.

## Commands

```bash
npm install          # Install dependencies
npm run compile     # Compile TypeScript to JavaScript
npm run watch       # Watch mode for development
npm run lint        # Run ESLint
npm test            # Run VSCode extension tests
```

## Architecture

### Entry Point
**`src/extension.ts`** - Main extension entry that:
- Registers all VSCode commands (dashboard, security guide, run full scan)
- Sets up auto-scanning via `onDidOpenTextDocument` and `onDidChangeTextDocument` with 300ms debounce
- Creates the diagnostic collection and listens for diagnostic changes to update the dashboard
- Registers CodeActionProviders for quick fixes

### Security Rules
Rules use a class-based architecture with inheritance:

**`src/diagnostics/rules/BaseRule.ts`** - Abstract base class providing:
- `id`, `description`, `severity`, `relatedInfo` properties
- `createDiagnostic()` helper that sets `source`, `code`, and attaches `relatedUrl`
- Abstract `scan()` method that subclasses must implement

**`src/diagnostics/rules/RegexRule.ts`** - Abstract class extending BaseRule for regex-based detection:
- Accepts multiple `patterns: RegExp[]` in constructor
- Implements `scan()` that iterates all patterns and creates diagnostics for matches

**Adding a new rule:**
1. Extend `RegexRule` (for regex-based) or `BaseRule` (for custom logic)
2. Implement the constructor with id, description, severity, patterns, and optional relatedInfo
3. Import and add the rule instance to the array in `src/diagnostics/rules/allRules.ts`

### Rule Execution
**`src/diagnostics/ruleManager.ts`** - `runAllRules()` iterates through all rules, calls each rule's `scan()` method, and produces VSCode Diagnostics. It augments the Diagnostic type with a custom `relatedUrl` field.

### Dashboard
**`src/dashboard.ts`** is no longer used (replaced by WebView). The dashboard is now implemented in **`src/resources/dashboard/`**:
- `index.html` - Main dashboard HTML with Chart.js for visualization
- `dashboard.js` - Handles displaying findings from the extension
- Uses WebView messaging to receive findings in real-time

### Code Actions
Each rule can provide quick-fix actions via a CodeActionProvider. Examples:
- `SqlInjectionCodeActionProvider` in `sqlInjectionRule.ts`
- `XssCodeActionProvider` in `xssRule.ts`
- `DomXssCodeActionProvider` in `domXssRule.ts`

### Supported Languages

JavaScript, TypeScript, Python, and HTML (configured in `activationEvents` and the language check in `scanDocument`).

## Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Main entry point, registers commands and auto-scan |
| `src/diagnostics/ruleManager.ts` | Runs all rules, produces Diagnostics |
| `src/diagnostics/rules/allRules.ts` | Registry of all security rule instances |
| `src/diagnostics/rules/BaseRule.ts` | Abstract base class for rules |
| `src/diagnostics/rules/RegexRule.ts` | Abstract class for regex-based rules |
| `src/dashboard.ts` | Legacy TreeView (replaced by WebView) |
| `src/resources/dashboard/` | Dashboard WebView implementation |
| `package.json` | Extension configuration, commands, activation events |