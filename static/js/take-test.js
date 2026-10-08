// Take Test List JavaScript with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", () => {
  const testList = document.getElementById("test-list");

  async function loadTests() {
    if (!testList) return;
    testList.innerHTML = "<p>Loading available tests...</p>";

    try {
      const response = await fetch("/api/student/tests");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load tests");
      }

      const tests = await response.json();
      testList.innerHTML = "";

      if (!tests || tests.length === 0) {
        testList.innerHTML = "<p>No tests available at this time.</p>";
        return;
      }

      tests.forEach((test) => {
        const card = document.createElement("div");
        card.className = "test-card";
        card.innerHTML = `
          <div class="test-title">${escapeHtml(test.title || "Untitled Test")}</div>
          <div class="test-info">Questions: ${test.total_questions || 0}</div>
          <div class="test-info">Duration: ${test.duration || "N/A"} min</div>
          <button class="start-btn" data-id="${test.id}">Start Test</button>
        `;

        card.querySelector("button").addEventListener("click", () => startTest(test.id));
        testList.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading tests:", error);
      testList.innerHTML = "<p>Failed to load tests. Try again later.</p>";
    }
  }

  function startTest(testId) {
    localStorage.setItem("selectedTestId", testId);
    window.location.href = `/take-test-session?test_id=${testId}`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loadTests();
});

function goBackToDashboard() {
  window.location.href = "/student";
}
window.goBackToDashboard = goBackToDashboard;
