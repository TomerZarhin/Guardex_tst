import * as vscode from "vscode";
import { BaseRule } from "./BaseRule";

/**
 * CookieWithoutSecureRule
 * Detects cookies set without the Secure flag.
 * Uses two-pass approach:
 *   1. Find all cookie-setting patterns
 *   2. Check each match for presence of 'secure' flag
 */
export class CookieWithoutSecureRule extends BaseRule {
  constructor() {
    super(
      "COOKIE_WITHOUT_SECURE",
      "Cookie missing Secure flag — cookies should be marked as Secure to prevent transmission over HTTP.",
      vscode.DiagnosticSeverity.Warning,
      {
        message:
          "Cookies with the Secure flag are only sent over HTTPS connections, protecting sensitive data from interception.",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html#secure-cookies",
      }
    );
  }

  scan(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Patterns to detect cookie-setting calls
    const cookiePatterns = [
      // Express: res.cookie('name', 'value', { options })
      /res\s*\.\s*cookie\s*\([^;]+,[^;]+(?:,\s*\{[^}]*\})?\)/g,
      // Native JS: document.cookie = 'name=value; ...'
      /document\s*\.\s*cookie\s*=[^;]+/g,
      // Node.js response: res.setHeader('Set-Cookie', '...')
      /res\s*\.\s*setHeader\s*\(\s*['"]Set-Cookie['"]\s*,\s*[^;]+/g,
      // Python (Flask): response.set_cookie('name', 'value', secure=False)
      /\.\s*set_cookie\s*\([^;]+,[^;]+(?:,\s*[^}]*)?/g,
    ];

    // First pass: Find all cookie matches
    const allMatches: { match: RegExpExecArray; patternIndex: number }[] = [];

    for (const pattern of cookiePatterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        allMatches.push({ match, patternIndex: 0 });
      }
    }

    // Second pass: Check each match for 'secure' flag
    for (const { match } of allMatches) {
      const cookieText = match[0];

      // Skip if already has secure flag (true or false)
      if (this.hasSecureFlag(cookieText)) {
        continue;
      }

      // Check for explicit 'secure: false' — still flag it as potentially insecure
      const hasSecureFalse = /secure\s*:\s*false/i.test(cookieText);

      let message: string;
      if (hasSecureFalse) {
        message =
          "Cookie has Secure flag explicitly disabled — this exposes the cookie over HTTP connections.";
      } else {
        message = this.description;
      }

      const diagnostic = this.createDiagnostic(
        document,
        match.index,
        match[0].length,
        message
      );

      diagnostics.push(diagnostic);
    }

    return diagnostics;
  }

  /**
   * Checks if the cookie string contains a secure flag in its options.
   */
  private hasSecureFlag(cookieText: string): boolean {
    // Match 'secure: true' or 'secure:true' with optional whitespace
    // Also matches 'secure' as a standalone flag in Set-Cookie header
    return /secure\s*:\s*true/i.test(cookieText) || /;\s*secure\s*(;|$)/i.test(cookieText);
  }
}