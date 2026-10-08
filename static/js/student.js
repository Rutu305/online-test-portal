// Student Dashboard JavaScript with Flask backend (No Firebase)

let studentCharts = {};

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("main-content");
  if (sidebar) sidebar.classList.toggle("collapsed");
  if (content) content.classList.toggle("expanded");
}
window.toggleSidebar = toggleSidebar;

async function renderStudentStats() {
  const content = document.getElementById("main-content");
  if (!content) return;
  content.innerHTML = "<h2>Loading dashboard...</h2>";

  try {
    const response = await fetch("/api/student/stats");
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }
      throw new Error("Failed to fetch student stats");
    }

    const data = await response.json();
    const completedTests = data.completedTests || 0;
    const totalTests = data.totalTests || 0;
    const averageScore = parseFloat(data.averageScore || 0);
    const recent = data.recent || [];

    const recentHTML = recent.map(r => `
      <li>📝 ${escapeHtml(r.testTitle || "Untitled")} - <strong>${r.score || 0}%</strong> on ${r.takenAt ? new Date(r.takenAt).toLocaleDateString() : "N/A"}</li>
    `).join('');

    content.innerHTML = `
      <h2 class="dashboard-title">🎓 Welcome to Your Dashboard</h2>

      <div class="chart-container" style="display:flex;justify-content:center;gap:30px;flex-wrap:wrap;margin:30px 0;">
        <div style="width:280px;height:280px;background:#fff;padding:15px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
          <canvas id="testsChart"></canvas>
        </div>
        <div style="width:280px;height:280px;background:#fff;padding:15px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
          <canvas id="scoreChart"></canvas>
        </div>
      </div>

      <div class="recent-activity">
        <h3>📌 Recent Activity</h3>
        <ul>${recentHTML || "<li>No recent activity. Take a test to get started!</li>"}</ul>
      </div>

      <div class="quote">
        <blockquote>“Success is the sum of small efforts, repeated day in and day out.”</blockquote>
      </div>

      <div class="actions">
        <a href="/take-test"><button style="cursor:pointer;">🚀 Take New Test</button></a>
        <button onclick="navigateTo('results')" style="cursor:pointer;">📊 View Results</button>
      </div>
    `;

    // Clean up old charts if exist
    if (studentCharts.testsChart) studentCharts.testsChart.destroy();
    if (studentCharts.scoreChart) studentCharts.scoreChart.destroy();

    const remainingTests = Math.max(0, totalTests - completedTests);

    // Chart: Completed vs Remaining Tests
    const ctx1 = document.getElementById("testsChart");
    if (ctx1 && typeof Chart !== "undefined") {
      studentCharts.testsChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ["Completed", "Remaining"],
          datasets: [{
            label: "Test Completion",
            data: [completedTests, remainingTests === 0 && completedTests === 0 ? 1 : remainingTests],
            backgroundColor: ["#4CAF50", "#FFCDD2"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "📘 Test Completion"
            },
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        }
      });
    }

    // Chart: Average Score
    const ctx2 = document.getElementById("scoreChart");
    if (ctx2 && typeof Chart !== "undefined") {
      studentCharts.scoreChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ["Score", "Remaining"],
          datasets: [{
            label: "Average Score",
            data: [averageScore, Math.max(0, 100 - averageScore)],
            backgroundColor: ["#2196F3", "#E0E0E0"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "📊 Avg. Score (" + averageScore + "%)"
            },
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        }
      });
    }

  } catch (error) {
    console.error("Error fetching stats:", error);
    content.innerHTML = "<p>Error loading dashboard stats.</p>";
  }
}

// Fetch Tests
async function fetchTests() {
  const container = document.getElementById("main-content");
  if (!container) return;
  container.innerHTML = "<h2>Loading tests...</h2>";

  try {
    const res = await fetch("/api/student/tests");
    const tests = await res.json();
    renderTests(tests);
  } catch (error) {
    container.innerHTML = "<p>Error loading tests.</p>";
    console.error("Error fetching tests:", error);
  }
}

function renderTests(tests) {
  const container = document.getElementById("main-content");
  if (!container) return;

  if (!tests || tests.length === 0) {
    container.innerHTML = `
      <h2>My Tests</h2>
      <p>No tests available right now. Please check back later.</p>
    `;
    return;
  }

  let html = `<h2>Available Tests</h2><div class="tests-grid" style="display:flex;flex-wrap:wrap;gap:20px;margin-top:20px;">`;
  tests.forEach(test => {
    html += `
      <div class="test-card" style="background:#fff;border-radius:12px;padding:22px;width:300px;box-shadow:0 4px 15px rgba(0,0,0,0.08);border-top:4px solid #1e88e5;">
        <div class="status" style="font-size:12px;color:#1e88e5;font-weight:bold;margin-bottom:6px;">AVAILABLE</div>
        <div class="title" style="font-size:18px;font-weight:bold;margin-bottom:8px;">${escapeHtml(test.title)}</div>
        <div class="desc" style="font-size:14px;color:#666;margin-bottom:12px;">${escapeHtml(test.description || "Take this test to check your proficiency.")}</div>
        <div class="meta" style="font-size:13px;color:#888;margin-bottom:4px;">⏱ Duration: ${test.duration} mins</div>
        <div class="meta" style="font-size:13px;color:#888;margin-bottom:15px;">❓ Questions: ${test.total_questions}</div>
        <a href="/take-test-session?test_id=${test.id}"><button style="background:#1e88e5;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:bold;cursor:pointer;width:100%;">Start Test</button></a>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// Results Database Page
async function renderResultsDatabase() {
  const content = document.getElementById("main-content");
  if (!content) return;
  content.innerHTML = "<h2>Results Database</h2><div class='results-table'><p>Loading results...</p></div>";

  try {
    const res = await fetch("/api/student/results");
    const userResults = await res.json();

    if (!userResults || userResults.length === 0) {
      content.innerHTML = "<h2>Results Database</h2><p>No test results found. Take a test first!</p>";
      return;
    }

    let tableHTML = `
      <h2>Results Database</h2>
      <div style="overflow-x:auto;margin-top:20px;">
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <thead>
            <tr style="background:#1e88e5;color:#fff;text-align:left;">
              <th style="padding:14px;">Test Title</th>
              <th style="padding:14px;">Correct</th>
              <th style="padding:14px;">Percentage</th>
              <th style="padding:14px;">Date Taken</th>
            </tr>
          </thead>
          <tbody>
            ${userResults.map(result => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:12px 14px;font-weight:600;">${escapeHtml(result.testTitle || "N/A")}</td>
                <td style="padding:12px 14px;">${result.correct} / ${result.total}</td>
                <td style="padding:12px 14px;"><strong style="color:#1e88e5;">${result.score}%</strong></td>
                <td style="padding:12px 14px;color:#666;">${result.takenAt ? new Date(result.takenAt).toLocaleString() : "N/A"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.innerHTML = tableHTML;
  } catch (error) {
    console.error("Error loading results:", error);
    content.innerHTML = "<p>Error loading results.</p>";
  }
}

// Account Page
async function renderStudentAccount() {
  const content = document.getElementById("main-content");
  if (!content) return;
  content.innerHTML = "<p>Loading account info...</p>";

  try {
    const res = await fetch("/api/student/account");
    const userData = await res.json();

    content.innerHTML = `
      <div class="account-section" style="background:#fff;padding:30px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.06);max-width:650px;">
        <h2>👤 My Profile</h2>
        <div class="account-info" style="margin-top:20px;display:flex;flex-direction:column;gap:12px;font-size:16px;">
          <div><strong>Name:</strong> <span>${escapeHtml(userData.name || "N/A")}</span></div>
          <div><strong>Email:</strong> <span>${escapeHtml(userData.email || "N/A")}</span></div>
          <div><strong>Role:</strong> <span>${escapeHtml(userData.role || "student")}</span></div>
          <div><strong>Member Since:</strong> <span>${userData.joined ? new Date(userData.joined).toLocaleDateString() : "N/A"}</span></div>
          <div><strong>Total Tests Taken:</strong> <span>${userData.totalTests || 0}</span></div>
          <div><strong>Average Score:</strong> <span>${userData.averageScore || 0}%</span></div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Account fetch error:", err);
    content.innerHTML = "<p>Error loading account information.</p>";
  }
}

// Navigation Logic
function navigateTo(section) {
  switch (section) {
    case 'home':
      renderStudentStats();
      break;
    case 'tests':
      fetchTests();
      break;
    case 'results':
      renderResultsDatabase();
      break;
    case 'account':
      renderStudentAccount();
      break;
    case 'help':
      const c = document.getElementById("main-content");
      if (c) c.innerHTML = `
        <h2>❓ Help & Support</h2>
        <p style="margin-top:10px;line-height:1.6;">If you have any questions about tests or results, please contact your instructor or portal administrator at <a href="mailto:admin@test.com">admin@test.com</a>.</p>
      `;
      break;
  }
}
window.navigateTo = navigateTo;

// Sign Out
async function signOutUser() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (err) {
    console.error("Sign-out error:", err);
  }
  window.location.href = "/login";
}
window.signOutUser = signOutUser;
window.signOut = signOutUser;

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial Page Load
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash === "#tests") {
    navigateTo("tests");
  } else if (hash === "#results") {
    navigateTo("results");
  } else if (hash === "#account") {
    navigateTo("account");
  } else {
    navigateTo("home");
  }
});
