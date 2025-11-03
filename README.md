# 🛡️ Guardex — VSCode Security Scanner (Sprint 1)

## 🎯 Project Overview
**Guardex** is a real-time VSCode extension designed to detect insecure coding patterns directly inside the editor.  
It highlights security issues (Diagnostics) and provides context-sensitive links to security guides and remediation advice.

---

## 🧱 Current Project Structure

src/
├── extension.ts → Main entry point (registers commands, dashboard, rules, etc.)
├── dashboard.ts → TreeView dashboard listing all detected issues
├── securityReport.ts → WebView showing detailed info for a selected finding
├── diagnostics/
│ ├── ruleManager.ts → Runs all rules and returns diagnostics
│ ├── rules/
│ │ ├── allRules.ts → Central registry of all security rules
│ │ ├── detectHardcodedPassword.ts
│ │ └── detectUnsafeEval.ts
│ └── codeActionProvider.ts → Handles Quick Fix / View Security Guide
resources/
├── play-light.svg
└── play-dark.svg


---

## ⚙️ Current Functionality

✅ **Automatic Scanning:**  
- Scans files on open or edit (`onDidOpenTextDocument`, `onDidChangeTextDocument`).  
- Displays warnings and errors directly in the VSCode editor.

✅ **Dashboard (TreeView):**  
- Lists all findings grouped by file.  
- Displays severity with colored icons (🔴 Error, 🟡 Warning, 🔵 Info).  
- Shows summary header (❌ errors / ⚠️ warnings / ℹ️ info).  
- Clicking a finding opens the file and highlights the relevant line.

✅ **Detailed WebView:**  
- When a finding is clicked, a side panel opens showing:
  - Rule ID, message, severity, file path, and line number.
  - Link to external OWASP or security guide (if available).

✅ **Hover Links:**  
- Hovering over a diagnostic in the code shows a clickable “[🔗 View Security Guide]” link.

✅ **Manual "Run Full Scan" Command:**  
- `Ctrl+Shift+P` → “Guardex: Run Full Project Scan”  
- Scans all project files and refreshes the dashboard.  
- Also accessible via ▶️ button in the dashboard toolbar.

---

## 🔧 Technologies Used
- **TypeScript + VSCode API**
- **Regex-based static analysis** for rule detection
- **VSCode Diagnostics API** for real-time warnings
- **WebView Panels** for interactive detail view
- **TreeDataProvider** for dashboard visualization

---

## 🚧 What’s Next (Sprint 2 Roadmap)

1. **Add More Security Rules**
   - Detect `debugger`, `console.log`, and `TODO` comments.
   - Identify suspicious `require()` or `import` of sensitive files.
   - Detect potential SQL Injection patterns (e.g., string concatenation in queries).
   - Detect use of unsafe crypto functions (e.g., MD5, SHA1).

2. **Improve WebView UI**
   - Add color-coded panels, icons, and remediation examples.
   - Display multiple findings per file in a table format.

3. **Add Settings Panel**
   - Allow toggling automatic scanning (onSave / onOpen).
   - Set severity thresholds (show only Errors & Warnings).

4. **Add `.guardexignore`**
   - Similar to `.gitignore` — let users exclude files or rule IDs.

5. **Export Reports**
   - Generate JSON / HTML report summarizing all findings.

6. **CI/CD Integration (Optional)**
   - Command-line Guardex runner for pipeline use.

---

## 🧭 How to Test Locally

1. Run:  
   ```bash
   npm install
   npm run compile

🧩 Notes for ChatGPT (Context Restoration)

If this project is reloaded in ChatGPT:

The extension is called Guardex.

It is a VSCode extension (TypeScript).

It scans code for insecure patterns and displays them in Diagnostics & a Dashboard.

The next focus is adding new rules and enhancing the WebView UI.

All existing functionality (scan, dashboard, hover, webview) already works.

✅ Summary

Guardex already behaves like a lightweight open-source alternative to tools like Cycode or SonarLint.
The next milestones are expanding rule coverage and making the user interface more polished.