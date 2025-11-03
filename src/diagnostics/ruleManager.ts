import * as vscode from 'vscode';
import { rules } from './rules/allRules';

export function runAllRules(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const rule of rules) {
    let match: RegExpExecArray | null;
    rule.regex.lastIndex = 0;

    while ((match = rule.regex.exec(text))) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      const diag = new vscode.Diagnostic(range, rule.description, rule.severity);
      diag.source = 'Guardex';
      diag.code = rule.id;

      // Tooltip קטן - רמז שיש מדריך זמין
      if (rule.relatedInfo?.url) {
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
