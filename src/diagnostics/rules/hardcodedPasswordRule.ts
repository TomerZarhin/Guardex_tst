import * as vscode from 'vscode';
import { RegexRule } from './RegexRule';

export class HardcodedPasswordRule extends RegexRule {
  constructor() {
    super(
      'HARDCODED_PASSWORD',
      'Hardcoded password detected — may expose sensitive credentials.',
      vscode.DiagnosticSeverity.Warning,
      [
        /\b(?:const|let|var)\s+\w*password\w*\s*=/gi
      ],
      {
        message:
          'Passwords should never be hardcoded. See OWASP Secrets Management Guide.',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
      }
    );
  }
}