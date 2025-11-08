import * as vscode from 'vscode';

export const unsafeDbCalls = {
  id: 'GDX001',
  description: 'Unsafe database call: possible SQL/NoSQL injection — use parameterized queries or bindings.',
  relatedInfo: { url: 'https://owasp.org/www-community/attacks/SQL_Injection', title: 'SQL Injection' },

  check(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // regex to find common db call invocations and capture the argument list
    const callRegex = /\b(?:db|connection|pool|client|sequelize|knex|mongoose|sql|pg)\.(?:query|execute|raw|run|exec|queryAsync|queryBuilder)\s*\(([\s\S]*?)\)/gi;
    let m: RegExpExecArray | null;

    function plusOutsideQuotes(s: string) {
      let inQuote: string | null = null;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inQuote) {
          if (ch === inQuote && s[i - 1] !== '\\') inQuote = null;
        } else {
          if (ch === '"' || ch === "'" || ch === '`') inQuote = ch;
          if (ch === '+') return true;
        }
      }
      return false;
    }

    while ((m = callRegex.exec(text)) !== null) {
      const args = m[1] ?? '';
      const matchStart = m.index;
      const matchLength = m[0].length;

      const hasTemplateInterpolation = /`[^`]*\$\{[^`]*\}`/.test(m[0]);
      const hasPlusConcat = plusOutsideQuotes(args);

      if (hasTemplateInterpolation || hasPlusConcat) {
        // compute range for the matched invocation
        const startPos = document.positionAt(matchStart);
        const endPos = document.positionAt(matchStart + matchLength);
        const range = new vscode.Range(startPos, endPos);

        const message = hasTemplateInterpolation
          ? 'Unsafe DB call: template literal with interpolation used in query. Use parameterized queries.'
          : 'Unsafe DB call: string concatenation used to build query. Use parameterized queries or bindings.';

        const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
        diag.code = 'GDX001';
        diag.source = 'guardex';
        diagnostics.push(diag);
      }
    }

    return diagnostics;
  }
};