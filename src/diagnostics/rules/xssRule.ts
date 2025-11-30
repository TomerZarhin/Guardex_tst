import * as vscode from 'vscode';

/**
 * Cross-Site Scripting (XSS) Detection Rule
 * Detects dynamic content passed to dangerous DOM sinks (e.g., innerHTML)
 * without apparent sanitization.
 */
export const xssRule = {
  id: 'cross-site-scripting',
  description: 'Potential Cross-Site Scripting (XSS) vulnerability - Sanitize or escape user input before using DOM sinks.',
  severity: vscode.DiagnosticSeverity.Warning, // Use Warning as it needs context validation

  // Regex to catch common XSS sinks being assigned a dynamic string (concatenated or template literal)
  regex: /(?:(?:\.innerHTML|\.outerHTML|\.insertAdjacentHTML|document\.write|\.html|document\.getElementById)\s*(?:=|\+=|\(|\))\s*(?:['"`].*?\+.*?['"`]|`.*?\$\{.*?\}.*?`|.*?\.html\s*\(.*?\+.*?\)|.*?\.html\s*\(\s*`.*?\$\{.*?\}`))/gi,

  relatedInfo: {
    url: 'https://owasp.org/www-community/attacks/xss/',
    message: 'Learn more about XSS prevention'
  }
};

/**
 * Code Action Provider for XSS fixes
 */
export class XssCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction[] | undefined {
        const diagnostic = vscode.languages
            .getDiagnostics(document.uri)
            .find(d => d.code === 'cross-site-scripting' && d.range.intersection(range));

        if (!diagnostic) return;

        const actions: vscode.CodeAction[] = [];
        
        // Suggest a quick fix for sanitization
        const fixAction = new vscode.CodeAction(
            '💡 Suggest DOMPurify Sanitization (Requires Library)',
            vscode.CodeActionKind.QuickFix
        );
        
        fixAction.diagnostics = [diagnostic];
        fixAction.edit = new vscode.WorkspaceEdit();
        
        // Assume the dangerous variable is the one being assigned to the sink
        const hintText = '\n// TODO: Sanitize user input using a library like DOMPurify:\n// const safeHTML = DOMPurify.sanitize(userInput);\n';
        
        fixAction.edit.insert(
            document.uri,
            new vscode.Position(range.start.line, 0),
            hintText
        );

        actions.push(fixAction);

        // Add "Learn More" action
        const learnMoreAction = new vscode.CodeAction(
            '📚 Learn about XSS prevention',
            vscode.CodeActionKind.QuickFix
        );
        learnMoreAction.command = {
            command: 'guardex.openSecurityGuide',
            title: 'Open Security Guide',
            arguments: [xssRule.relatedInfo?.url, xssRule.description]
        };
        actions.push(learnMoreAction);

        return actions;
    }
}