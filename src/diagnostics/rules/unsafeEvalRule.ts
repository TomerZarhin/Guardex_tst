import * as vscode from 'vscode';
import { SecurityRule } from '../types';

/**
 * Detects usage of eval(), which can lead to code injection vulnerabilities.
 */
export const unsafeEvalRule: SecurityRule = {
  id: 'UNSAFE_EVAL',
  description: '⚠ Use of eval() detected — may allow arbitrary code execution.',
  severity: vscode.DiagnosticSeverity.Error,
  regex: /eval\s*\(/g,
  relatedInfo: {
    message: 'Avoid using eval(). It can execute malicious code. See OWASP Code Injection guide.',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Vulnerabilities_Cheat_Sheet.html#vulnerability-code-injection'
  }
};
