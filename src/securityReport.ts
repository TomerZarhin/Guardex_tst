import * as vscode from 'vscode';
import { Finding } from './dashboard';

/**
 * Displays a detailed WebView for a selected finding.
 */
export class SecurityReportView {
  public static show(finding: Finding) {
    const panel = vscode.window.createWebviewPanel(
      'guardexFindingDetails',
      `Guardex Report — ${finding.ruleId}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    const severityColor =
      finding.severity === vscode.DiagnosticSeverity.Error
        ? '#ff5555'
        : finding.severity === vscode.DiagnosticSeverity.Warning
        ? '#f1c40f'
        : '#3daee9';

    panel.webview.html = `
      <html>
        <body style="font-family:sans-serif;background-color:#1e1e1e;color:white;padding:20px;">
          <h2 style="color:${severityColor};margin-bottom:5px;">${finding.ruleId}</h2>
          <p style="margin-top:0;font-size:14px;">${finding.message}</p>
          <p><b>File:</b> ${finding.file}</p>
          <p><b>Line:</b> ${finding.range.start.line + 1}</p>
          <hr style="margin:15px 0;border-color:#444;">
          <p style="font-size:13px;">Severity: 
            <span style="color:${severityColor};font-weight:bold;">
              ${vscode.DiagnosticSeverity[finding.severity]}
            </span>
          </p>
          ${
            finding.relatedUrl
              ? `<p><a href="${finding.relatedUrl}" style="color:#3daee9;text-decoration:none;" target="_blank">
                  🌐 View OWASP Guide
                 </a></p>`
              : ''
          }
        </body>
      </html>
    `;
  }
}
