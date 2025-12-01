window.addEventListener("message", event => {
    const findings = event.data;
    if (!Array.isArray(findings)) return;

    renderAllFindings(findings);
    renderSeverityChart(findings);
    renderFileChart(findings);
    renderHeatmap(findings);
});

// --- TABLE ---
function renderAllFindings(findings) {
    const tbody = document.querySelector("#findingsTable tbody");
    tbody.innerHTML = "";

    findings.forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${severityLabel(f.severity)}</td>
          <td>${f.ruleId}</td>
          <td>${f.file.split(/[\\/]/).pop()}</td>
          <td>${f.range.start.line + 1}</td>
        `;
        tbody.appendChild(tr);
    });
}

function severityLabel(s) {
    return s === 0 ? "❌ Error"
         : s === 1 ? "⚠ Warning"
         : "ℹ Info";
}

// --- PIE CHART (Severity) ---
function renderSeverityChart(findings) {
    const ctx = document.getElementById("severityPie");

    const counts = {
        error: findings.filter(f => f.severity === 0).length,
        warn: findings.filter(f => f.severity === 1).length,
        info: findings.filter(f => f.severity === 2).length,
    };

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Error", "Warning", "Info"],
            datasets: [{
                data: [counts.error, counts.warn, counts.info],
                backgroundColor: ["#ff4d4d", "#ffcc00", "#58a6ff"]
            }]
        }
    });
}

// --- BAR CHART (Files) ---
function renderFileChart(findings) {
    const ctx = document.getElementById("fileBar");

    const grouped = {};
    findings.forEach(f => {
        const file = f.file.split(/[\\/]/).pop();
        grouped[file] = (grouped[file] || 0) + 1;
    });

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(grouped),
            datasets: [{
                label: "Findings",
                data: Object.values(grouped),
                backgroundColor: "#58a6ff"
            }]
        }
    });
}

// --- HEATMAP ---
function renderHeatmap(findings) {
    const container = document.getElementById("heatmap");
    container.innerHTML = "";

    const grouped = {};
    findings.forEach(f => {
        const file = f.file.split(/[\\/]/).pop();
        grouped[file] = (grouped[file] || 0) + 1;
    });

    Object.entries(grouped).forEach(([file, count]) => {
        const box = document.createElement("div");
        box.className = "heatbox";

        const intensity = Math.min(255, 60 + count * 25);
        box.style.backgroundColor = `rgb(${intensity}, 50, 50)`;

        box.innerHTML = `
            <strong>${file}</strong><br>
            ${count} issues
        `;
        container.appendChild(box);
    });
}
