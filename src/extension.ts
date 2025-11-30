import * as vscode from 'vscode';
import { runAllRules } from './diagnostics/ruleManager';
import { GuardexCodeActionProvider } from './diagnostics/codeActionProvider';
import { rules } from './diagnostics/rules/allRules';
import { DashboardProvider } from './dashboard';
import { SecurityReportView } from './securityReport';
import { SqlInjectionCodeActionProvider } from './diagnostics/rules/sqlInjectionRule';
import { XssCodeActionProvider } from './diagnostics/rules/xssRule';

/**
 * Guardex - Real-time Security Diagnostics Extension
 */
export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection('guardex');
  let debounceTimer: NodeJS.Timeout | undefined;

  // 📘 פקודה כללית לפתיחת מדריך אבטחה
  const openSecurityGuideCmd = vscode.commands.registerCommand(
    'guardex.openSecurityGuide',
    (url?: string, description?: string) => {
      if (!url) {
        vscode.window.showErrorMessage('Guardex: No security guide URL found for this rule.');
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        'guardexGuide',
        'Guardex Security Guide',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      panel.webview.html = `
        <html>
          <body style="margin:0;padding:0;overflow:hidden;background-color:#1e1e1e;color:white;">
            <div style="font-family:sans-serif;padding:10px 14px;">
              <h2 style="margin-top:0;">${description ?? 'Security Guide'}</h2>
              <iframe 
                src="${url}" 
                style="width:100%;height:90vh;border:none;background:white;">
              </iframe>
            </div>
          </body>
        </html>`;
    }
  );
  context.subscriptions.push(openSecurityGuideCmd);

  // 💡 רישום של Quick Fix
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'javascript' },
      new GuardexCodeActionProvider(),
      { providedCodeActionKinds: GuardexCodeActionProvider.providedCodeActionKinds }
    )
  );

  // 💬 Hover Provider - מציג קישור לחיץ
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [{ scheme: 'file', language: 'javascript' }, { scheme: 'file', language: 'typescript' }],
      {
        provideHover(doc, pos) {
          const diags = vscode.languages
            .getDiagnostics(doc.uri)
            .filter(d => d.range.contains(pos) && typeof d.code === 'string');

          if (diags.length === 0) return;

          const diag = diags[0];
          const rule = rules.find(r => r.id === diag.code);

          if (!rule?.relatedInfo?.url) return;

          const args = encodeURIComponent(JSON.stringify([rule.relatedInfo.url, rule.description]));
          const markdown = new vscode.MarkdownString(
            `[🔗 View Security Guide](command:guardex.openSecurityGuide?${args})`
          );
          markdown.isTrusted = true;

          return new vscode.Hover(markdown);
        }
      }
    )
  );

  context.subscriptions.push(
  vscode.languages.registerCodeActionsProvider(
    [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'python' }
    ],
    new SqlInjectionCodeActionProvider(),
    { providedCodeActionKinds: SqlInjectionCodeActionProvider.providedCodeActionKinds }
  )
);

context.subscriptions.push(
  vscode.languages.registerCodeActionsProvider(
    [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' }
    ],
    new XssCodeActionProvider(),
    { providedCodeActionKinds: XssCodeActionProvider.providedCodeActionKinds }
  )
);

  // 🧭 Dashboard registration (TreeView)
  const dashboardProvider = new DashboardProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('guardex.dashboard', dashboardProvider)
  );

  // 📂 פקודה לפתיחת ממצא
  context.subscriptions.push(
    vscode.commands.registerCommand('guardex.openFinding', (finding) => {
      const uri = vscode.Uri.file(finding.file);
      vscode.window.showTextDocument(uri).then(editor => {
        editor.revealRange(finding.range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(finding.range.start, finding.range.end);
        SecurityReportView.show(finding);
      });
    })
  );

  // 🔁 רענון הדאשבורד
  context.subscriptions.push(
    vscode.commands.registerCommand('guardex.refreshDashboard', () => {
      dashboardProvider.refresh();
    })
  );

  // 🧮 פקודה חדשה: Scan on Demand
  context.subscriptions.push(
    vscode.commands.registerCommand('guardex.runFullScan', async () => {
      vscode.window.showInformationMessage('Guardex: Running full project scan...');
      const uris = await vscode.workspace.findFiles('**/*.{js,ts,py}', '**/node_modules/**');

      for (const uri of uris) {
        const doc = await vscode.workspace.openTextDocument(uri);
        const text = doc.getText();
        const fileDiagnostics = runAllRules(text, doc);
        diagnostics.set(uri, fileDiagnostics);
      }

      setTimeout(() => dashboardProvider.refresh(), 300);
      vscode.window.showInformationMessage('Guardex: Full scan completed.');
    })
  );

  // מאזינים לשינויים בקבצים
  vscode.workspace.onDidOpenTextDocument(scanDocument);
  vscode.workspace.onDidChangeTextDocument(e => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => scanDocument(e.document), 400);
  });

  function scanDocument(document: vscode.TextDocument) {
    if (document.languageId === 'json' || document.languageId === 'markdown') return;

    const text = document.getText();
    const allDiagnostics = runAllRules(text, document);

    diagnostics.set(document.uri, allDiagnostics);
    setTimeout(() => dashboardProvider.refresh(), 200);
  }
}

export function deactivate() {}
