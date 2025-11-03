import * as vscode from 'vscode';
import { rules } from './diagnostics/rules/allRules';

export interface Finding {
  id: string;
  ruleId: string;
  message: string;
  file: string;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  relatedUrl?: string;
}

class FindingItem extends vscode.TreeItem {
  constructor(public finding: Finding) {
    const prefix =
      finding.severity === vscode.DiagnosticSeverity.Error
        ? '🔴'
        : finding.severity === vscode.DiagnosticSeverity.Warning
        ? '🟡'
        : '🔵';

    super(`${prefix} ${finding.ruleId} — ${finding.message}`, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${finding.file}:${finding.range.start.line + 1}`;
    this.command = {
      command: 'guardex.openFinding',
      title: 'Open Finding',
      arguments: [finding]
    };
    this.contextValue = 'finding';
    this.iconPath =
      finding.severity === vscode.DiagnosticSeverity.Error
        ? new vscode.ThemeIcon('error')
        : finding.severity === vscode.DiagnosticSeverity.Warning
        ? new vscode.ThemeIcon('warning')
        : new vscode.ThemeIcon('info');
  }
}

class FileItem extends vscode.TreeItem {
  constructor(public filePath: string, public children: FindingItem[]) {
    const fileName = vscode.Uri.file(filePath).fsPath.split(/[/\\]/).pop() ?? filePath;
    super(fileName, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'file';

    // badge showing count of findings
    const issueCount = children.length;
    const badge =
      issueCount === 1 ? '1 issue' : `${issueCount} issues`;
    this.description = badge;

    // choose icon based on highest severity
    const hasError = children.some(c => c.finding.severity === vscode.DiagnosticSeverity.Error);
    const hasWarning = children.some(c => c.finding.severity === vscode.DiagnosticSeverity.Warning);
    this.iconPath = hasError
      ? new vscode.ThemeIcon('error')
      : hasWarning
      ? new vscode.ThemeIcon('warning')
      : new vscode.ThemeIcon('info');
  }
}

export class DashboardProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (element instanceof FileItem) {
      return element.children;
    }

    const allDiags = vscode.languages.getDiagnostics();
    const findings: Finding[] = [];

    for (const [uri, diags] of allDiags) {
      const file = uri.fsPath;
      for (const d of diags) {
        const id = `${file}:${d.range.start.line}:${d.range.start.character}:${d.code ?? d.message}`;
        const finding: Finding = {
          id,
          ruleId: String(d.code ?? 'UNKNOWN'),
          message: d.message,
          file,
          range: d.range,
          severity: d.severity,
          relatedUrl: undefined
        };

        if (d.relatedInformation && d.relatedInformation.length) {
          const msg = String(d.relatedInformation[0].message);
          const m = msg.match(/https?:\/\/\S+/);
          if (m) finding.relatedUrl = m[0];
        }

        findings.push(finding);
      }
    }

    // group findings by file
    const byFile = new Map<string, Finding[]>();
    for (const f of findings) {
      const arr = byFile.get(f.file) ?? [];
      arr.push(f);
      byFile.set(f.file, arr);
    }

    // create items
    const fileItems: FileItem[] = [];
    for (const [filePath, fsFindings] of byFile) {
      const children = fsFindings.map(f => new FindingItem(f));
      fileItems.push(new FileItem(filePath, children));
    }

    // counts for header
    const errorCount = findings.filter(f => f.severity === vscode.DiagnosticSeverity.Error).length;
    const warningCount = findings.filter(f => f.severity === vscode.DiagnosticSeverity.Warning).length;
    const infoCount = findings.filter(f => f.severity === vscode.DiagnosticSeverity.Information).length;

    const summary = new vscode.TreeItem(
      `Summary: ❌ ${errorCount}  ⚠️ ${warningCount}  ℹ️ ${infoCount}`,
      vscode.TreeItemCollapsibleState.None
    );
    summary.iconPath = new vscode.ThemeIcon('shield');
    summary.contextValue = 'summary';

    const resultList: vscode.TreeItem[] = [summary, ...fileItems];

    if (fileItems.length === 0) {
      return [new vscode.TreeItem('No findings detected')];
    }

    fileItems.sort((a, b) => b.children.length - a.children.length);

    return resultList;
  }
}
