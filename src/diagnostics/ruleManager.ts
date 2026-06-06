import * as vscode from 'vscode';
import { rules } from './rules/allRules';

/**
 * Runs all security rules and produces VSCode Diagnostics.
 */
export function runAllRules(
  text: string,
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const rule of rules) {
    if ('scan' in rule) {
      diagnostics.push(...rule.scan(text, document));
    }
  }

  return diagnostics;
}

/**
 * Extension: Add custom field (relatedUrl) to VSCode Diagnostic type.
 */
declare module 'vscode' {
  interface Diagnostic {
    relatedUrl?: string;
  }
}