/**
 * GuardEx Dashboard Script
 * Handles rendering of security findings and data visualization
 */

// Global variables to track chart instances
let vulnerabilityChartInstance = null;
let fileChartInstance = null;

// Handle messages from the VS Code Extension
window.addEventListener("message", (event) => {
  const findings = event.data;
  if (!Array.isArray(findings)) return;

  renderAllFindings(findings);
  renderVulnerabilityChart(findings); // Now grouping by Type/RuleID
  renderFileChart(findings);
  renderHeatmap(findings);
});

// --- 1. TABLE: List all findings ---
function renderAllFindings(findings) {
  const tbody = document.querySelector("#findingsTable tbody");
  tbody.innerHTML = "";

  findings.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
          
          <td>${f.ruleId}</td>
          <td>${f.file.split(/[\\/]/).pop()}</td>
          <td>${f.range.start.line + 1}</td>
        `;
    tbody.appendChild(tr);
  });
}

function severityLabel(s) {
  return s === 0 ? "❌ Error" : s === 1 ? "⚠ Warning" : "ℹ Info";
}

// --- 2. PIE CHART: Vulnerability Types (Rule IDs) ---
function renderVulnerabilityChart(findings) {
  const ctx = document.getElementById("severityPie");

  // Calculate Data: Group by Rule ID (e.g., 'sql-injection', 'cross-site-scripting')
  const counts = {};
  findings.forEach((f) => {
    counts[f.ruleId] = (counts[f.ruleId] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);

  // Dynamic colors for different vulnerability types
  const colorPalette = [
    "#ff4d4d", // Red
    "#ffcc00", // Yellow
    "#58a6ff", // Blue
    "#7ee787", // Green
    "#d2a8ff", // Purple
    "#ffa657", // Orange
  ];

  // 1. UPDATE existing chart if it exists
  if (vulnerabilityChartInstance) {
    vulnerabilityChartInstance.data.labels = labels;
    vulnerabilityChartInstance.data.datasets[0].data = dataValues;
    vulnerabilityChartInstance.data.datasets[0].backgroundColor =
      colorPalette.slice(0, labels.length);
    vulnerabilityChartInstance.update();
    return;
  }

  // 2. CREATE new chart
  vulnerabilityChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: colorPalette.slice(0, labels.length),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: "Vulnerabilities by Category",
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
    },
  });
}

// --- 3. BAR CHART: Findings per File ---
function renderFileChart(findings) {
  const ctx = document.getElementById("fileBar");

  const grouped = {};
  findings.forEach((f) => {
    const file = f.file.split(/[\\/]/).pop();
    grouped[file] = (grouped[file] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const dataValues = Object.values(grouped);

  if (fileChartInstance) {
    fileChartInstance.data.labels = labels;
    fileChartInstance.data.datasets[0].data = dataValues;
    fileChartInstance.update();
    return;
  }

  fileChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Issues Found",
          data: dataValues,
          backgroundColor: "#58a6ff",
        },
      ],
    },
    options: {
      animation: { duration: 800 },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

// --- 4. HEATMAP: Visual Hotspots ---
function renderHeatmap(findings) {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";

  const grouped = {};
  findings.forEach((f) => {
    const file = f.file.split(/[\\/]/).pop();
    grouped[file] = (grouped[file] || 0) + 1;
  });

  Object.entries(grouped).forEach(([file, count]) => {
    const box = document.createElement("div");
    box.className = "heatbox";

    // Increase red intensity based on count of issues
    const intensity = Math.min(255, 60 + count * 25);
    box.style.backgroundColor = `rgb(${intensity}, 50, 50)`;
    box.style.color = "white";

    box.innerHTML = `
            <strong>${file}</strong><br>
            ${count} issues
        `;
    container.appendChild(box);
  });
}
