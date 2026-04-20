import * as vscode from "vscode";

/**
 * DOM-based XSS Detection Rule
 * Detects dangerous DOM sinks receiving data from untrusted sources:
 * localStorage, sessionStorage, URL parameters, document.cookie
 */
export const domXssRule = {
  id: "dom-xss",
  description:
    "Potential XSS vulnerability - Unsafe use of innerHTML, document.cookie, or data from untrusted sources",
  severity: vscode.DiagnosticSeverity.Error,

  // Regex to detect innerHTML/outerHTML assignments that are NOT wrapped in DOMPurify.sanitize()
  // OR document.cookie access (can be used to steal session data)
  regex:
    /(?:(?:\.(?:innerHTML|outerHTML|insertAdjacentHTML)\s*(?:\+?=)\s*(?!\s*(?:DOMPurify\.sanitize\(|['"`])))|document\.cookie\b)/g,

  relatedInfo: {
    url: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html",
    message: "Learn more about DOM XSS prevention",
  },
};

/**
 * Code Action Provider for DOM XSS fixes
 */
export class DomXssCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): vscode.CodeAction[] | undefined {
    const diagnostic = vscode.languages
      .getDiagnostics(document.uri)
      .find((d) => d.code === "dom-xss" && d.range.intersection(range));

    if (!diagnostic) return;

    const actions: vscode.CodeAction[] = [];

    const fixAction = new vscode.CodeAction(
      "💡 Sanitize using DOMPurify before assigning to innerHTML",
      vscode.CodeActionKind.QuickFix,
    );

    fixAction.diagnostics = [diagnostic];
    fixAction.edit = new vscode.WorkspaceEdit();

    const hintText =
      "\n// TODO: Sanitize user input before using innerHTML:\n// const safeHTML = DOMPurify.sanitize(userInput);\n// element.innerHTML = safeHTML;\n";

    fixAction.edit.insert(
      document.uri,
      new vscode.Position(range.start.line, 0),
      hintText,
    );

    actions.push(fixAction);

    const learnMoreAction = new vscode.CodeAction(
      "📚 Learn about DOM XSS prevention",
      vscode.CodeActionKind.QuickFix,
    );
    learnMoreAction.command = {
      command: "guardex.openSecurityGuide",
      title: "Open Security Guide",
      arguments: [domXssRule.relatedInfo?.url, domXssRule.description],
    };
    actions.push(learnMoreAction);

    return actions;
  }
}
