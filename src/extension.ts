import * as vscode from 'vscode';
import * as fs from 'fs';
import { runAllRules } from './diagnostics/ruleManager';
import { GuardexCodeActionProvider } from './diagnostics/codeActionProvider';
import { rules } from './diagnostics/rules/allRules';
import { DashboardProvider } from './dashboard';
import { SecurityReportView } from './securityReport';
import { SqlInjectionCodeActionProvider } from './diagnostics/rules/sqlInjectionRule';
import { XssCodeActionProvider } from './diagnostics/rules/xssRule';

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection('guardex');
  let debounceTimer: NodeJS.Timeout | undefined;

  // -------------------- DASHBOARD -------------------
  // 📊 Command: Open Guardex Dashboard
const openDashboardCmd = vscode.commands.registerCommand(
  "guardex.openDashboard",
  async () => {
    const panel = vscode.window.createWebviewPanel(
      "guardexDashboard",
      "Guardex — Security Dashboard",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "src", "resources", "dashboard"),
          vscode.Uri.joinPath(context.extensionUri, "src", "resources", "dashboard", "libs")
        ]
      }
    );

    // Load HTML
    const htmlPath = vscode.Uri.joinPath(
      context.extensionUri,
      "src",
      "resources",
      "dashboard",
      "index.html"
    );

    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    // Convert JS libs to URIs
    const chartUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "src", "resources", "dashboard", "libs", "chart.min.js")
    );

    const dashboardScriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "src", "resources", "dashboard", "dashboard.js")
    );

    // Inject scripts
    html = html
      .replace(`<script id="chart-lib"></script>`, `<script src="${chartUri}"></script>`)
      .replace(`<script id="dashboard-script"></script>`, `<script src="${dashboardScriptUri}"></script>`);

    panel.webview.html = html;

    // Send findings after load
    setTimeout(() => {
      const findings = collectAllFindings();
      panel.webview.postMessage(findings);
    }, 400);
  }
);

context.subscriptions.push(openDashboardCmd);

  // -------------------- SERIALIZE FINDINGS --------------------
  function collectAllFindings() {
    const results: any[] = [];
    const all = vscode.languages.getDiagnostics();

    for (const [uri, diags] of all) {
      for (const d of diags) {
        results.push({
          ruleId: String(d.code),
          message: d.message,
          file: uri.fsPath,
          severity: d.severity,
          relatedUrl: (d as any).relatedUrl,

          range: {
            start: { line: d.range.start.line, character: d.range.start.character },
            end: { line: d.range.end.line, character: d.range.end.character }
          }
        });
      }
    }

    return results;
  }

  // ---------------- SECURITY GUIDE ----------------
  const openSecurityGuideCmd = vscode.commands.registerCommand(
    'guardex.openSecurityGuide',
    (arg1?: any, arg2?: any) => {
      let url: string | undefined;
      let description: string | undefined;

      if (Array.isArray(arg1)) {
        [url, description] = arg1;
      } else if (typeof arg1 === 'string' && arg1.trim().startsWith('[')) {
        try {
          const arr = JSON.parse(arg1);
          url = arr[0];
          description = arr[1];
        } catch {
          url = arg1;
          description = arg2;
        }
      } else {
        url = arg1;
        description = arg2;
      }

      if (!url) return;

      const panel = vscode.window.createWebviewPanel(
        'guardexGuide',
        `Security Guide — ${description}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      panel.webview.html = `
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin:0;padding:0;">
      <iframe src="${url}" style="border:none;width:100%;height:100vh"></iframe>
      </body>
      </html>`;
    }
  );

  context.subscriptions.push(openSecurityGuideCmd);

  // ---------------- CODE ACTIONS ----------------
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: "file", language: "javascript" },
      new GuardexCodeActionProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [{ scheme: "file", language: "javascript" }, { scheme: "file", language: "typescript" }, { scheme: "file", language: "python" }],
      new SqlInjectionCodeActionProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [{ scheme: "file", language: "javascript" }, { scheme: "file", language: "typescript" }],
      new XssCodeActionProvider()
    )
  );

  // ---------------- AUTO-SCAN ----------------
  vscode.workspace.onDidOpenTextDocument(scanDocument);
  vscode.workspace.onDidChangeTextDocument(e => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => scanDocument(e.document), 300);
  });

  function scanDocument(document: vscode.TextDocument) {
    if (!["javascript", "typescript", "python"].includes(document.languageId)) return;

    const text = document.getText();
    diagnostics.set(document.uri, runAllRules(text, document));
  }
}

export function deactivate() {}
