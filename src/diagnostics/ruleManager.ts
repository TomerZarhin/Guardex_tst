import * as vscode from 'vscode';
import { rules } from './rules/allRules';

/**
 * Runs all security rules and produces VSCode Diagnostics.
 */
export function runAllRules(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const rule of rules) {
    let match: RegExpExecArray | null;

    // Reset regex state before scanning
    rule.regex.lastIndex = 0;

    while ((match = rule.regex.exec(text))) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      // Create diagnostic for this finding
      const diag = new vscode.Diagnostic(range, rule.description, rule.severity);
      diag.source = 'Guardex';
      diag.code = rule.id;

      // ⭐ NEW: Attach related URL to diagnostic (required for SecurityReportView)
      if (rule.relatedInfo?.url) {
        (diag as any).relatedUrl = rule.relatedInfo.url;

        // Optional tooltip hint (VSCode built-in UI)
        diag.relatedInformation = [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(document.uri, new vscode.Position(start.line, 0)),
            `💡 Tip: Press Ctrl+. and choose "View Security Guide" to learn more about this issue.`
          )
        ];
      }

      diagnostics.push(diag);
    }
  }

  return diagnostics;
}

/**
 * Extension: Add custom field (relatedUrl) to VSCode Diagnostic type.
 */
declare module 'vscode' {
  interface Diagnostic {
    relatedUrl?: string;
  }
}
