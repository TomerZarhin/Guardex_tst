import * as vscode from 'vscode';

/**
 * Defines a unified structure for every Guardex security rule.
 */
export interface SecurityRule {
  /** Unique rule ID */
  id: string;

  /** Main message shown to the user */
  description: string;

  /** Diagnostic severity level */
  severity: vscode.DiagnosticSeverity;

  /** Regex used to detect the pattern */
  patterns: RegExp[];

  /** Optional related information (extra context or documentation link) */
  relatedInfo?: {
    message: string;
    url?: string;
  };
}
