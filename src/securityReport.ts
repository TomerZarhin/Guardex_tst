import * as vscode from 'vscode';
import { Finding } from './dashboard';

/**
 * Displays an enriched WebView for a selected finding.
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

    const url = finding.relatedUrl;

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">

        <!-- CSP allowing external OWASP iframe -->
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          frame-src https:;
          img-src https:;
          style-src 'unsafe-inline';
          script-src 'unsafe-inline';
        ">

        <style>
          body {
            padding: 0;
            margin: 0;
            background: #1e1e1e;
            color: white;
            font-family: sans-serif;
          }
          .header {
            padding: 20px;
            border-bottom: 1px solid #444;
          }
          .title {
            font-size: 20px;
            color: ${severityColor};
            margin: 0;
          }
          .message {
            font-size: 14px;
            margin-top: 6px;
            color: #ddd;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 20px;
            color: #ccc;
          }
          .details {
            padding: 20px;
          }
          .iframe-container {
            height: 70vh;
            border-top: 1px solid #444;
            border-bottom: 1px solid #444;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
          }
        </style>

      </head>

      <body>

        <!-- Header -->
        <div class="header">
          <h2 class="title">${finding.ruleId}</h2>
          <div class="message">${finding.message}</div>
        </div>

        ${
          url
            ? `
            <div class="iframe-container">
              <iframe 
                src="${url}"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
              </iframe>
            </div>
          `
            : `
            <div class="details">
              <p style="color:#aaa;">No security guide available for this rule.</p>
            </div>
          `
        }

        <!-- Details Section -->
        <div class="details">
          <div class="section-title">Details</div>
          <p><b>File:</b> ${finding.file}</p>
          <p><b>Line:</b> ${finding.range.start.line + 1}</p>
          <p><b>Severity:</b> <span style="color:${severityColor};">${vscode.DiagnosticSeverity[finding.severity]}</span></p>
        </div>

      </body>
      </html>
    `;
  }
}
