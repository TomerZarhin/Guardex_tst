// Global variables to track chart instances
let severityChartInstance = null;
let fileChartInstance = null;

window.addEventListener("message", (event) => {
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

  findings.forEach((f) => {
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
  return s === 0 ? "❌ Error" : s === 1 ? "⚠ Warning" : "ℹ Info";
}

// --- PIE CHART (Severity) ---
function renderSeverityChart(findings) {
  const ctx = document.getElementById("severityPie");

  // Calculate Data
  const counts = {
    error: findings.filter((f) => f.severity === 0).length,
    warn: findings.filter((f) => f.severity === 1).length,
    info: findings.filter((f) => f.severity === 2).length,
  };
  const dataValues = [counts.error, counts.warn, counts.info];

  // 1. UPDATE existing chart if it exists (Smooth Animation)
  if (severityChartInstance) {
    severityChartInstance.data.datasets[0].data = dataValues;
    severityChartInstance.update();
    return;
  }

  // 2. CREATE new chart if it doesn't exist
  severityChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Error", "Warning", "Info"],
      datasets: [
        {
          data: dataValues,
          backgroundColor: ["#ff4d4d", "#ffcc00", "#58a6ff"],
        },
      ],
    },
    options: {
      animation: {
        duration: 800, // 800ms smooth transition
        easing: "easeOutQuart",
      },
    },
  });
}

// --- BAR CHART (Files) ---
function renderFileChart(findings) {
  const ctx = document.getElementById("fileBar");

  // Calculate Data
  const grouped = {};
  findings.forEach((f) => {
    const file = f.file.split(/[\\/]/).pop();
    grouped[file] = (grouped[file] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const dataValues = Object.values(grouped);

  // 1. UPDATE existing chart
  if (fileChartInstance) {
    fileChartInstance.data.labels = labels;
    fileChartInstance.data.datasets[0].data = dataValues;
    fileChartInstance.update();
    return;
  }

  // 2. CREATE new chart
  fileChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Findings",
          data: dataValues,
          backgroundColor: "#58a6ff",
        },
      ],
    },
    options: {
      animation: {
        duration: 800,
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

// --- HEATMAP ---
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
