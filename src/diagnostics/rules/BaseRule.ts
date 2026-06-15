import * as vscode from 'vscode';

export abstract class BaseRule {
  constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly severity: vscode.DiagnosticSeverity,
    public readonly relatedInfo?: {
      message: string;
      url?: string;
    }
  ) {}

  abstract scan(text: string, document: vscode.TextDocument): vscode.Diagnostic[];

  protected createDiagnostic(
    document: vscode.TextDocument,
    startIndex: number,
    length: number,
    message?: string
  ): vscode.Diagnostic {
    const start = document.positionAt(startIndex);
    const end = document.positionAt(startIndex + length);
    const range = new vscode.Range(start, end);

    let diagnosticMessage = message ?? this.description;

    if (this.relatedInfo?.url) {
      diagnosticMessage += `\n\n🔗 Security Guide: ${this.relatedInfo.url}`;
    }

    const diag = new vscode.Diagnostic(
      range,
      diagnosticMessage,
      this.severity
    );

    diag.source = 'Guardex';
    diag.code = this.id;

    if (this.relatedInfo?.url) {
      (diag as any).relatedUrl = this.relatedInfo.url;

      diag.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(document.uri, new vscode.Position(start.line, 0)),
          `💡 Tip: Press Ctrl+. and choose "View Security Guide" to learn more about this issue.`
        )
      ];
    }

    return diag;
  }
}