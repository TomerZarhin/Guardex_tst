import * as vscode from "vscode";
import { RegexRule } from "./RegexRule";

export class HardcodedPasswordRule extends RegexRule {
  constructor() {
    super(
      "HARDCODED_PASSWORD",
      "Hardcoded password detected — may expose sensitive credentials.",
      vscode.DiagnosticSeverity.Warning,
      [
        /\b(?:const|let|var)\s+(?:\w*password\w*|\w*passwd\w*|\w*pwd\w*|\w*pass\w*|\w*secret\w*|\w*token\w*|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth[_-]?token)\s*=\s*(['"`])(?:(?!\1).){2,}\1/gi,
      ],
      {
        message:
          "Passwords should never be hardcoded. See OWASP Secrets Management Guide.",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
      },
    );
  }
}
