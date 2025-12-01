import * as vscode from 'vscode';
import { Diagnostic } from 'vscode';

export interface Finding {
  ruleId: string;
  message: string;
  file: string;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  relatedUrl?: string;
}

export class DashboardProvider implements vscode.TreeDataProvider<FindingItem | SeverityGroup> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FindingItem | SeverityGroup): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SeverityGroup | FindingItem): Promise<(FindingItem | SeverityGroup)[]> {
    if (!element) {
      const diagnostics = this.collectDiagnostics();
      const groups = this.groupBySeverity(diagnostics);
      return groups;
    }

    if (element instanceof SeverityGroup) {
      return element.findings.map(f => new FindingItem(f));
    }

    return [];
  }

  private collectDiagnostics(): Finding[] {
    const result: Finding[] = [];
    const collection = vscode.languages.getDiagnostics();

    for (const [uri, diags] of collection) {
      for (const d of diags) {
        result.push({
          ruleId: String(d.code),
          message: d.message,
          file: uri.fsPath,
          range: d.range,
          severity: d.severity,
          relatedUrl: (d as any).relatedUrl
        });
      }
    }

    return result;
  }

  private groupBySeverity(findings: Finding[]): SeverityGroup[] {
    const groups: { [key: string]: Finding[] } = {
      [vscode.DiagnosticSeverity.Error]: [],
      [vscode.DiagnosticSeverity.Warning]: [],
      [vscode.DiagnosticSeverity.Information]: []
    };

    findings.forEach(f => {
      if (f.severity in groups) {
        groups[f.severity].push(f);
      }
    });

    return [
      new SeverityGroup("Errors", vscode.DiagnosticSeverity.Error, groups[vscode.DiagnosticSeverity.Error]),
      new SeverityGroup("Warnings", vscode.DiagnosticSeverity.Warning, groups[vscode.DiagnosticSeverity.Warning]),
      new SeverityGroup("Info", vscode.DiagnosticSeverity.Information, groups[vscode.DiagnosticSeverity.Information])
    ];
  }
}

class SeverityGroup extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly severity: vscode.DiagnosticSeverity,
    public readonly findings: Finding[]
  ) {
    super(`${label} (${findings.length})`, vscode.TreeItemCollapsibleState.Collapsed);

    this.iconPath = new vscode.ThemeIcon(
      severity === vscode.DiagnosticSeverity.Error
        ? "error"
        : severity === vscode.DiagnosticSeverity.Warning
        ? "warning"
        : "info"
    );

    this.contextValue = 'severityGroup';
  }
}

class FindingItem extends vscode.TreeItem {
  constructor(public readonly finding: Finding) {
    super(
      `${FindingItem.getSeverityIcon(finding.severity)} ${finding.ruleId} — ${FindingItem.shortenPath(finding.file)}`,
      vscode.TreeItemCollapsibleState.None
    );

    this.tooltip = `${finding.message}\nFile: ${finding.file}`;
    this.command = {
      command: 'guardex.openFinding',
      title: 'Open Finding',
      arguments: [finding]
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
    return path.split(/[/\\]/).slice(-1)[0];
  }
}
