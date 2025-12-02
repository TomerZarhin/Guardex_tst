import * as vscode from "vscode";
import * as fs from "fs";
import { runAllRules } from "./diagnostics/ruleManager";
import { GuardexCodeActionProvider } from "./diagnostics/codeActionProvider";
// import { rules } from './diagnostics/rules/allRules'; // unused in snippet provided
import { SqlInjectionCodeActionProvider } from "./diagnostics/rules/sqlInjectionRule";
import { XssCodeActionProvider } from "./diagnostics/rules/xssRule";

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection("guardex");
  let debounceTimer: NodeJS.Timeout | undefined;

  // 1. Keep track of the current panel so we can update it later
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  // -------------------- DASHBOARD -------------------
  const openDashboardCmd = vscode.commands.registerCommand(
    "guardex.openDashboard",
    async () => {
      // If panel already exists, just show it
      if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Beside);
        return;
      }

      currentPanel = vscode.window.createWebviewPanel(
        "guardexDashboard",
        "Guardex — Security Dashboard",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(
              context.extensionUri,
              "src",
              "resources",
              "dashboard"
            ),
            vscode.Uri.joinPath(
              context.extensionUri,
              "src",
              "resources",
              "dashboard",
              "libs"
            ),
          ],
        }
      );

      // Cleanup when closed
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
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
      const chartUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
          context.extensionUri,
          "src",
          "resources",
          "dashboard",
          "libs",
          "chart.min.js"
        )
      );

      const dashboardScriptUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
          context.extensionUri,
          "src",
          "resources",
          "dashboard",
          "dashboard.js"
        )
      );

      // Inject scripts
      html = html
        .replace(
          `<script id="chart-lib"></script>`,
          `<script src="${chartUri}"></script>`
        )
        .replace(
          `<script id="dashboard-script"></script>`,
          `<script src="${dashboardScriptUri}"></script>`
        );

      currentPanel.webview.html = html;

      // Send initial findings
      updateDashboard();
    }
  );

  context.subscriptions.push(openDashboardCmd);

  // -------------------- LISTEN FOR UPDATES --------------------
  // 2. This is the key part: When diagnostics change, update the dashboard
  const diagnosticChangeListener = vscode.languages.onDidChangeDiagnostics(
    () => {
      if (currentPanel && currentPanel.visible) {
        updateDashboard();
      }
    }
  );

  context.subscriptions.push(diagnosticChangeListener);

  function updateDashboard() {
    if (!currentPanel) return;
    const findings = collectAllFindings();
    currentPanel.webview.postMessage(findings);
  }

  // -------------------- SERIALIZE FINDINGS --------------------
  function collectAllFindings() {
    const results: any[] = [];
    const all = vscode.languages.getDiagnostics();

    for (const [uri, diags] of all) {
      for (const d of diags) {
        // Optional: Filter only for your specific source if needed
        // if (d.source !== 'guardex') continue;

        results.push({
          ruleId: String(d.code),
          message: d.message,
          file: uri.fsPath,
          severity: d.severity,
          relatedUrl: (d as any).relatedUrl,

          range: {
            start: {
              line: d.range.start.line,
              character: d.range.start.character,
            },
            end: { line: d.range.end.line, character: d.range.end.character },
          },
        });
      }
    }

    return results;
  }

  // ---------------- SECURITY GUIDE ----------------
  const openSecurityGuideCmd = vscode.commands.registerCommand(
    "guardex.openSecurityGuide",
    (arg1?: any, arg2?: any) => {
      // ... (Your existing code for the guide remains unchanged)
      // keeping it brief for the response, but keep your original logic here
      let url: string | undefined;
      let description: string | undefined;

      if (Array.isArray(arg1)) {
        [url, description] = arg1;
      } else if (typeof arg1 === "string" && arg1.trim().startsWith("[")) {
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
        "guardexGuide",
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
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "python" },
      ],
      new SqlInjectionCodeActionProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
      ],
      new XssCodeActionProvider()
    )
  );

  // ---------------- AUTO-SCAN ----------------
  vscode.workspace.onDidOpenTextDocument(scanDocument);
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => scanDocument(e.document), 300);
  });

  function scanDocument(document: vscode.TextDocument) {
    if (!["javascript", "typescript", "python"].includes(document.languageId))
      return;

    const text = document.getText();
    diagnostics.set(document.uri, runAllRules(text, document));
    // Note: The listener onDidChangeDiagnostics created above will handle the dashboard update automatically
    // once this set() completes.
  }
}

export function deactivate() {}
