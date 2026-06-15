import * as vscode from "vscode";
import { RegexRule } from "./RegexRule";

export class SqlInjectionRule extends RegexRule {
  constructor() {
    super(
      "sql-injection",
      "Potential SQL Injection vulnerability - Use parameterized queries instead",
      vscode.DiagnosticSeverity.Warning,
      [
        /(?:(?:query|sql|execute|exec)\w*\s*(?:=|\+=)\s*(?:['"`].*?\+.*?['"`]|`.*?\$\{.*?\}.*?`|\+\s*\w+)|\.(?:query|execute|raw)\s*\(\s*(?:['"`].*?\$\{.*?\}.*?['"`]|.*?\+.*?\))|(?:cursor\.execute|execute)\s*\(\s*(?:['"].*?%s.*?['"]\s*%|f['"].*?\{.*?\}.*?['"]))/gis,
      ],
      {
        url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
        message: "Learn more about SQL Injection prevention",
      },
    );
  }
}

/**
 * Code Action Provider for SQL Injection fixes
 */
export class SqlInjectionCodeActionProvider
  implements vscode.CodeActionProvider
{
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): vscode.CodeAction[] | undefined {
    const diagnostic = vscode.languages
      .getDiagnostics(document.uri)
      .find((d) => d.code === "sql-injection" && d.range.intersection(range));

    if (!diagnostic) return;

    const actions: vscode.CodeAction[] = [];

    const fixAction = new vscode.CodeAction(
      "💡 Convert to parameterized query",
      vscode.CodeActionKind.QuickFix,
    );

    fixAction.diagnostics = [diagnostic];
    fixAction.edit = new vscode.WorkspaceEdit();

    let hintText = "\n// TODO: Convert to parameterized query\n";

    if (document.languageId === "python") {
      hintText +=
        '// Example: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))\n';
    } else {
      hintText +=
        '// Example: db.query("SELECT * FROM users WHERE id = ?", [userId])\n';
    }

    fixAction.edit.insert(
      document.uri,
      new vscode.Position(range.start.line, 0),
      hintText,
    );

    actions.push(fixAction);

    const learnMoreAction = new vscode.CodeAction(
      "📚 Learn about SQL Injection prevention",
      vscode.CodeActionKind.QuickFix,
    );

    learnMoreAction.command = {
      command: "guardex.openSecurityGuide",
      title: "Open Security Guide",
      arguments: [
        "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
        "Potential SQL Injection vulnerability - Use parameterized queries instead",
      ],
    };

    actions.push(learnMoreAction);

    return actions;
  }
}
