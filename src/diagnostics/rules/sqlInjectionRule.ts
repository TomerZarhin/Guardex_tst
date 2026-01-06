import * as vscode from "vscode";

/**
 * SQL Injection Detection Rule
 * Detects potentially unsafe SQL query patterns
 */
export const sqlInjectionRule = {
  id: "sql-injection",
  description:
    "Potential SQL Injection vulnerability - Use parameterized queries instead",
  severity: vscode.DiagnosticSeverity.Error,

  // Combined regex to catch common SQL injection patterns
  regex:
    /(?:(?:query|sql|execute|exec)\s*(?:=|\+=)\s*(?:['"`].*?\+.*?['"`]|`.*?\$\{.*?\}.*?`)|\.(?:query|execute|raw)\s*\(\s*(?:['"`].*?\$\{.*?\}.*?['"`]|.*?\+.*?\))|(?:cursor\.execute|execute)\s*\(\s*(?:['"].*?%s.*?['"]\s*%|f['"].*?\{.*?\}.*?['"]))/gi,

  relatedInfo: {
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
    message: "Learn more about SQL Injection prevention",
  },
};

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
    range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    const diagnostic = vscode.languages
      .getDiagnostics(document.uri)
      .find((d) => d.code === "sql-injection" && d.range.intersection(range));

    if (!diagnostic) return;

    const actions: vscode.CodeAction[] = [];

    // Suggest parameterized query fix with examples
    const fixAction = new vscode.CodeAction(
      "💡 Convert to parameterized query",
      vscode.CodeActionKind.QuickFix
    );

    fixAction.diagnostics = [diagnostic];
    fixAction.edit = new vscode.WorkspaceEdit();

    // Provide language-specific examples
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
      hintText
    );

    actions.push(fixAction);

    // Add "Learn More" action
    const learnMoreAction = new vscode.CodeAction(
      "📚 Learn about SQL Injection prevention",
      vscode.CodeActionKind.QuickFix
    );
    learnMoreAction.command = {
      command: "guardex.openSecurityGuide",
      title: "Open Security Guide",
      arguments: [
        sqlInjectionRule.relatedInfo?.url,
        sqlInjectionRule.description,
      ],
    };
    actions.push(learnMoreAction);

    return actions;
  }
}
