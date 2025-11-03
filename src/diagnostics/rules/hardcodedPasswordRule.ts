import * as vscode from 'vscode';
import { SecurityRule } from '../types';

export const hardcodedPasswordRule: SecurityRule = {
  id: 'HARDCODED_PASSWORD',
  description: 'Hardcoded password detected — may expose sensitive credentials.',
  severity: vscode.DiagnosticSeverity.Warning,
  regex: /\b(?:const|let|var)\s+\w*password\w*\s*=/gi,
  relatedInfo: {
     message: 'Passwords should never be hardcoded. See OWASP Secrets Management Guide.',
      url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
  }
};
