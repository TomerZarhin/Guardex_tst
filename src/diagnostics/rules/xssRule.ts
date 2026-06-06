import * as vscode from "vscode";
import { RegexRule } from "./RegexRule";

/**
 * Cross-Site Scripting (XSS) Detection Rule
 * Detects dynamic content passed to dangerous DOM sinks (e.g., innerHTML)
 * without apparent sanitization.
 */
export class XssRule extends RegexRule {
  constructor() {
    super(
      "cross-site-scripting",
      "Potential Cross-Site Scripting (XSS) vulnerability - Sanitize or escape user input before using DOM sinks.",
      vscode.DiagnosticSeverity.Warning,
      [
        /(?:(?:\.innerHTML|\.outerHTML|\.insertAdjacentHTML|document\.write|\.html|document\.getElementById)\s*(?:=|\+=|\(|\))\s*(?:['"`].*?\+.*?['"`]|`.*?\$\{.*?\}.*?`|.*?\.html\s*\(.*?\+.*?\)|.*?\.html\s*\(\s*`.*?\$\{.*?\}`))/gi
      ],
      {
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
        message: "Learn more about XSS prevention",
      }
    );
  }
}

/**
 * Code Action Provider for XSS fixes
 */
export class XssCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    const diagnostic = vscode.languages
      .getDiagnostics(document.uri)
      .find(
        (d) => d.code === "cross-site-scripting" && d.range.intersection(range)
      );

    if (!diagnostic) return;

    const actions: vscode.CodeAction[] = [];

    const fixAction = new vscode.CodeAction(
      "💡 Suggest DOMPurify Sanitization (Requires Library)",
      vscode.CodeActionKind.QuickFix
    );

    fixAction.diagnostics = [diagnostic];
    fixAction.edit = new vscode.WorkspaceEdit();

    const hintText =
      "\n// TODO: Sanitize user input using a library like DOMPurify:\n// const safeHTML = DOMPurify.sanitize(userInput);\n";

    fixAction.edit.insert(
      document.uri,
      new vscode.Position(range.start.line, 0),
      hintText
    );

    actions.push(fixAction);

    const learnMoreAction = new vscode.CodeAction(
      "📚 Learn about XSS prevention",
      vscode.CodeActionKind.QuickFix
    );

    learnMoreAction.command = {
      command: "guardex.openSecurityGuide",
      title: "Open Security Guide",
      arguments: [
        "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
        "Potential Cross-Site Scripting (XSS) vulnerability - Sanitize or escape user input before using DOM sinks.",
      ],
    };

    actions.push(learnMoreAction);

    return actions;
  }
}