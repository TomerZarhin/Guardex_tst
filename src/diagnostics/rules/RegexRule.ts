import * as vscode from 'vscode';
import { BaseRule } from './BaseRule';

export abstract class RegexRule extends BaseRule {
  constructor(
    id: string,
    description: string,
    severity: vscode.DiagnosticSeverity,
    protected readonly patterns: RegExp[],
    relatedInfo?: {
      message: string;
      url?: string;
    }
  ) {
    super(id, description, severity, relatedInfo);
  }

  scan(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const pattern of this.patterns) {
      let match: RegExpExecArray | null;

      pattern.lastIndex = 0;

      while ((match = pattern.exec(text))) {
        const diagnostic = this.createDiagnostic(
          document,
          match.index,
          match[0].length
        );

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }
}