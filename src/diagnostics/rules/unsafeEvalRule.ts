import * as vscode from 'vscode';
import { RegexRule } from './RegexRule';

export class UnsafeEvalRule extends RegexRule {
  constructor() {
    super(
      'UNSAFE_EVAL',
      '⚠ Use of eval() detected — may allow arbitrary code execution.',
      vscode.DiagnosticSeverity.Warning,
      [
        /eval\s*\(/g
      ],
      {
        message:
          'Avoid using eval(). It can execute malicious code. See OWASP Code Injection guide.',
        url:
          'https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Vulnerabilities_Cheat_Sheet.html#vulnerability-code-injection'
      }
    );
  }
}