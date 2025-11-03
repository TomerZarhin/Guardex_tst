import * as vscode from 'vscode';
import { rules } from './rules/allRules';

/**
 * ✅ Generic Quick Fix provider for all Guardex rules.
 * If a rule has a relatedInfo.url, it automatically provides
 * a "View Security Guide" quick fix that opens the WebView.
 */
export class GuardexCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] | undefined {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      // מוצא את החוק המתאים לפי הקוד של ה-diagnostic
      const rule = rules.find(r => r.id === diagnostic.code);

      // אם לחוק יש מדריך חיצוני — ניצור פעולה מתאימה
      if (rule?.relatedInfo?.url) {
        const action = new vscode.CodeAction(
          'View Security Guide',
          vscode.CodeActionKind.QuickFix
        );

        action.command = {
          title: 'View Security Guide',
          command: 'guardex.openSecurityGuide', // 👈 הפקודה החדשה הכללית
          arguments: [rule.relatedInfo.url, rule.description]
        };

        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        actions.push(action);
      }
    }

    return actions;
  }

  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
}
