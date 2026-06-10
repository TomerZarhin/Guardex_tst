/**
 * GuardEx Dashboard Script
 * Handles rendering of security findings and data visualization
 */

// Global variables to track state
let vulnerabilityChartInstance = null;
let allFindings = [];
let filteredFindings = [];
let sortColumn = null;
let sortDirection = 'asc';

// Rule type badge configuration
const ruleBadgeConfig = {
  'sql-injection': { class: 'badge-sql', label: 'SQL Injection', icon: '🔮' },
  'cross-site-scripting': { class: 'badge-xss', label: 'XSS', icon: '⚡' },
  'dom-xss': { class: 'badge-dom-xss', label: 'DOM XSS', icon: '🌐' },
  'UNSAFE_EVAL': { class: 'badge-eval', label: 'Unsafe Eval', icon: '⚠️' },
  'HARDCODED_PASSWORD': { class: 'badge-password', label: 'Hardcoded Password', icon: '🔑' }
};

// Warning color palette for charts
const warningPalette = [
  '#f0b429', // Warning yellow
  '#ff8c00', // Orange
  '#00bfff', // Blue
  '#8a2be2', // Purple
  '#32cd32', // Green
  '#ff6347', // Red-orange
];

// Handle messages from the VS Code Extension
window.addEventListener("message", (event) => {
  const findings = event.data;
  if (!Array.isArray(findings)) return;

  allFindings = findings;
  filteredFindings = [...findings];

  updateLastUpdated();
  renderStats();
  renderAllFindings();
  renderVulnerabilityChart();
  renderHeatmap();
});

// --- UTILITIES ---

function updateLastUpdated() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('lastUpdated').textContent = `Last updated: ${time}`;
}

function getBadgeForRule(ruleId) {
  const config = ruleBadgeConfig[ruleId] || { class: 'badge-default', label: ruleId, icon: '📋' };
  return `<span class="badge ${config.class}">${config.icon} ${config.label}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- STATS ---

function renderStats() {
  const total = filteredFindings.length;
  const files = new Set(filteredFindings.map(f => f.file)).size;

  document.getElementById('totalFindings').textContent = `${total} finding${total !== 1 ? 's' : ''}`;
  document.getElementById('totalFiles').textContent = `${files} file${files !== 1 ? 's' : ''}`;
}

// --- FILTER & SEARCH ---

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const ruleFilter = document.getElementById('ruleFilter').value;

  filteredFindings = allFindings.filter(f => {
    const matchesSearch = !searchTerm ||
      f.file.toLowerCase().includes(searchTerm) ||
      f.ruleId.toLowerCase().includes(searchTerm);
    const matchesRule = !ruleFilter || f.ruleId === ruleFilter;
    return matchesSearch && matchesRule;
  });

  if (sortColumn) {
    sortFindings();
  }

  renderStats();
  renderAllFindings();
  renderVulnerabilityChart();
  renderHeatmap();
}

function setupFilters() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('ruleFilter').addEventListener('change', applyFilters);
}

// --- SORTING ---

function sortFindings() {
  filteredFindings.sort((a, b) => {
    let valA, valB;

    switch (sortColumn) {
      case 'ruleId':
        valA = a.ruleId;
        valB = b.ruleId;
        break;
      case 'file':
        valA = a.file;
        valB = b.file;
        break;
      case 'line':
        valA = a.range.start.line;
        valB = b.range.start.line;
        break;
      default:
        return 0;
    }

    if (typeof valA === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });
}

function setupSorting() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;

      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }

      // Update visual indicators
      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = sortDirection === 'asc' ? '↑' : '↓';

      sortFindings();
      renderAllFindings();
    });
  });
}

// --- TABLE ---

function renderAllFindings() {
  const tbody = document.querySelector("#findingsTable tbody");
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.querySelector('.table-container');

  tbody.innerHTML = "";

  if (filteredFindings.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  tableContainer.style.display = 'block';
  emptyState.style.display = 'none';

  filteredFindings.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rule-cell">${getBadgeForRule(f.ruleId)}</td>
      <td>${escapeHtml(f.file.split(/[\\/]/).pop())}</td>
      <td>${f.range.start.line + 1}</td>
    `;
    tr.addEventListener('click', () => {
      // Send message to extension to navigate to the finding
      if (typeof window.acquireVsCodeApi === 'function') {
        const vscodeApi = window.acquireVsCodeApi();
        vscodeApi.postMessage({ command: 'navigate', finding: f });
      }
    });
    tbody.appendChild(tr);
  });
}

// --- PIE CHART ---

function renderVulnerabilityChart() {
  const ctx = document.getElementById("severityPie");
  if (!ctx) return;

  const counts = {};
  filteredFindings.forEach((f) => {
    const label = ruleBadgeConfig[f.ruleId]?.label || f.ruleId;
    counts[label] = (counts[label] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);

  if (vulnerabilityChartInstance) {
    vulnerabilityChartInstance.data.labels = labels;
    vulnerabilityChartInstance.data.datasets[0].data = dataValues;
    vulnerabilityChartInstance.data.datasets[0].backgroundColor = warningPalette.slice(0, labels.length);
    vulnerabilityChartInstance.update();
    return;
  }

  if (labels.length === 0) return;

  vulnerabilityChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: warningPalette.slice(0, labels.length),
          borderColor: '#1e1e1e',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e0e0e0', padding: 15 }
        },
        title: {
          display: true,
          text: 'Vulnerabilities by Category',
          color: '#e0e0e0',
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
    },
  });
}

// --- HEATMAP ---

function renderHeatmap() {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";

  const grouped = {};
  filteredFindings.forEach((f) => {
    const file = f.file.split(/[\\/]/).pop();
    grouped[file] = (grouped[file] || 0) + 1;
  });

  Object.entries(grouped)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .forEach(([file, count]) => {
      const box = document.createElement("div");
      box.className = 'heatbox';

      // Gradient from yellow to red based on count
      const intensity = Math.min(count / 5, 1);
      const r = Math.round(240 - intensity * 100);
      const g = Math.round(180 - intensity * 130);
      const b = Math.round(41 - intensity * 30);
      box.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      box.style.color = "white";

      box.innerHTML = `
        <div class="file-name">${escapeHtml(file)}</div>
        <div class="count">${count} issue${count !== 1 ? 's' : ''}</div>
      `;

      box.addEventListener('click', () => {
        // Filter to show only this file
        document.getElementById('searchInput').value = file;
        applyFilters();
      });

      container.appendChild(box);
    });
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  setupSorting();
});