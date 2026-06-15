import * as vscode from "vscode";
import * as fs from "fs";
import { runAllRules } from "./diagnostics/ruleManager";
import { GuardexCodeActionProvider } from "./diagnostics/codeActionProvider";
import { SqlInjectionCodeActionProvider } from "./diagnostics/rules/sqlInjectionRule";
import { XssCodeActionProvider } from "./diagnostics/rules/xssRule";
import { DomXssCodeActionProvider } from "./diagnostics/rules/domXssRule";

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection("guardex");
  let debounceTimer: NodeJS.Timeout | undefined;
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const openDashboardCmd = vscode.commands.registerCommand(
    "guardex.openDashboard",
    async () => {
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
              "dashboard",
            ),
            vscode.Uri.joinPath(
              context.extensionUri,
              "src",
              "resources",
              "dashboard",
              "libs",
            ),
          ],
        },
      );

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions,
      );

      // Handle messages from the dashboard webview
      currentPanel.webview.onDidReceiveMessage((message: any) => {
        if (message.command === "navigate" && message.finding) {
          const finding = message.finding;
          const uri = vscode.Uri.file(finding.file);
          vscode.workspace.openTextDocument(uri).then((doc) => {
            vscode.window.showTextDocument(doc).then((editor) => {
              const position = new vscode.Position(
                finding.range.start.line,
                finding.range.start.character,
              );
              const selection = new vscode.Selection(position, position);
              editor.selection = selection;
              editor.revealRange(
                selection,
                vscode.TextEditorRevealType.InCenter,
              );
            });
          });
        }
      });

      // Refresh dashboard when it becomes visible again
      currentPanel.onDidChangeViewState(() => {
        if (currentPanel && currentPanel.visible) {
          updateDashboard();
        }
      });

      const htmlPath = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "resources",
        "dashboard",
        "index.html",
      );

      let html = fs.readFileSync(htmlPath.fsPath, "utf8");

      const chartUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
          context.extensionUri,
          "src",
          "resources",
          "dashboard",
          "libs",
          "chart.min.js",
        ),
      );

      const dashboardScriptUri = currentPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
          context.extensionUri,
          "src",
          "resources",
          "dashboard",
          "dashboard.js",
        ),
      );

      html = html
        .replace(
          `<script id="chart-lib"></script>`,
          `<script src="${chartUri}"></script>`,
        )
        .replace(
          `<script id="dashboard-script"></script>`,
          `<script src="${dashboardScriptUri}"></script>`,
        );

      currentPanel.webview.html = html;
      updateDashboard();
    },
  );

  context.subscriptions.push(openDashboardCmd);

  const diagnosticChangeListener = vscode.languages.onDidChangeDiagnostics(
    () => {
      if (currentPanel && currentPanel.visible) {
        updateDashboard();
      }
    },
  );

  context.subscriptions.push(diagnosticChangeListener);

  function updateDashboard() {
    if (!currentPanel) {
      return;
    }

    const findings = collectAllFindings();
    currentPanel.webview.postMessage(findings);
  }

  function collectAllFindings() {
    const results: any[] = [];
    const all = vscode.languages.getDiagnostics();

    for (const [uri, diags] of all) {
      for (const d of diags) {
        if (d.source !== "Guardex") {
          continue;
        }

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
            end: {
              line: d.range.end.line,
              character: d.range.end.character,
            },
          },
        });
      }
    }

    return results;
  }

  const openSecurityGuideCmd = vscode.commands.registerCommand(
    "guardex.openSecurityGuide",
    (arg1?: any, arg2?: any) => {
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

      if (!url) {
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        "guardexGuide",
        `Security Guide — ${description}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true },
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
    },
  );

  context.subscriptions.push(openSecurityGuideCmd);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "html" },
      ],
      new GuardexCodeActionProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "html" },
      ],
      new SqlInjectionCodeActionProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "html" },
      ],
      new XssCodeActionProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "html" },
      ],
      new DomXssCodeActionProvider(),
    ),
  );

  vscode.workspace.onDidOpenTextDocument(scanDocument);

  vscode.workspace.textDocuments.forEach(scanDocument);

  vscode.workspace.onDidChangeTextDocument((e) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      scanDocument(e.document);
    }, 300);
  });

  function scanDocument(document: vscode.TextDocument) {
    if (
      !["javascript", "typescript", "python", "html"].includes(
        document.languageId,
      )
    ) {
      return;
    }

    const text = document.getText();
    diagnostics.set(document.uri, runAllRules(text, document));
  }
}

export function deactivate() {}
