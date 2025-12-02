import * as vscode from "vscode";
import { Diagnostic } from "vscode";

export interface Finding {
  ruleId: string;
  message: string;
  file: string;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  relatedUrl?: string;
}

export class DashboardProvider
  implements vscode.TreeDataProvider<FindingItem | SeverityGroup>
{
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  private diagnosticCollection: vscode.DiagnosticCollection | undefined;

  constructor() {
    // 1. Listen for any diagnostic changes globally
    // This fires whenever ANY extension (including yours) updates warnings/errors
    vscode.languages.onDidChangeDiagnostics(() => {
      this.refresh();
    });
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FindingItem | SeverityGroup): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: SeverityGroup | FindingItem
  ): Promise<(FindingItem | SeverityGroup)[]> {
    if (!element) {
      const diagnostics = this.collectDiagnostics();
      // If there are no diagnostics, you might want to return a "No problems found" item
      // or just return the groups empty.
      const groups = this.groupBySeverity(diagnostics);
      return groups;
    }

    if (element instanceof SeverityGroup) {
      return element.findings.map((f) => new FindingItem(f));
    }

    return [];
  }

  private collectDiagnostics(): Finding[] {
    const result: Finding[] = [];
    const collection = vscode.languages.getDiagnostics();

    for (const [uri, diags] of collection) {
      for (const d of diags) {
        // Optional: Filter by source to only show Guardex issues
        // if (d.source !== 'guardex') continue;

        result.push({
          ruleId: String(d.code),
          message: d.message,
          file: uri.fsPath,
          range: d.range,
          severity: d.severity,
          relatedUrl: (d as any).relatedUrl,
        });
      }
    }

    return result;
  }

  private groupBySeverity(findings: Finding[]): SeverityGroup[] {
    const groups: { [key: string]: Finding[] } = {
      [vscode.DiagnosticSeverity.Error]: [],
      [vscode.DiagnosticSeverity.Warning]: [],
      [vscode.DiagnosticSeverity.Information]: [],
    };

    findings.forEach((f) => {
      if (f.severity in groups) {
        groups[f.severity].push(f);
      }
    });

    return [
      new SeverityGroup(
        "Errors",
        vscode.DiagnosticSeverity.Error,
        groups[vscode.DiagnosticSeverity.Error]
      ),
      new SeverityGroup(
        "Warnings",
        vscode.DiagnosticSeverity.Warning,
        groups[vscode.DiagnosticSeverity.Warning]
      ),
      new SeverityGroup(
        "Info",
        vscode.DiagnosticSeverity.Information,
        groups[vscode.DiagnosticSeverity.Information]
      ),
    ];
  }
}

class SeverityGroup extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly severity: vscode.DiagnosticSeverity,
    public readonly findings: Finding[]
  ) {
    // Only show the group if it has findings, or always show it (your choice).
    // Here we append the count.
    super(
      `${label} (${findings.length})`,
      vscode.TreeItemCollapsibleState.Collapsed
    );

    this.iconPath = new vscode.ThemeIcon(
      severity === vscode.DiagnosticSeverity.Error
        ? "error"
        : severity === vscode.DiagnosticSeverity.Warning
        ? "warning"
        : "info"
    );

    this.contextValue = "severityGroup";

    // If 0 findings, usually better to not allow expansion, or hide it entirely in getChildren
    if (findings.length === 0) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
  }
}

class FindingItem extends vscode.TreeItem {
  constructor(public readonly finding: Finding) {
    super(
      `${FindingItem.getSeverityIcon(finding.severity)} ${
        finding.ruleId
      } — ${FindingItem.shortenPath(finding.file)}`,
      vscode.TreeItemCollapsibleState.None
    );

    this.tooltip = `${finding.message}\nFile: ${finding.file}`;
    this.command = {
      command: "guardex.openFinding", // Ensure this command is registered in package.json
      title: "Open Finding",
      arguments: [finding],
    };
  }

  static getSeverityIcon(sev: vscode.DiagnosticSeverity) {
    return sev === vscode.DiagnosticSeverity.Error
      ? "🔴"
      : sev === vscode.DiagnosticSeverity.Warning
      ? "🟡"
      : "🔵";
  }

  static shortenPath(path: string) {
    // Simple logic to get filename.
    // You might want path.relative(workspaceRoot, path) for better context
    return path.split(/[/\\]/).slice(-1)[0];
  }
}
