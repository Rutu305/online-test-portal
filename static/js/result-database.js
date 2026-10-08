// Results Database script with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", async () => {
  const resultsContainer = document.getElementById("resultsContainer");
  const noResultsText = document.getElementById("noResults");

  try {
    const res = await fetch("/api/student/results");
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
        return;
      }
      throw new Error("Failed to load results");
    }

    const results = await res.json();

    if (!results || results.length === 0) {
      if (noResultsText) {
        noResultsText.textContent = "No results found. Take a test first!";
        noResultsText.style.display = "block";
      }
      return;
    }

    if (noResultsText) noResultsText.style.display = "none";
    resultsContainer.innerHTML = "";

    results.forEach((data) => {
      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = `
        <h3>${escapeHtml(data.testTitle)}</h3>
        <p><strong>Score:</strong> ${data.correct} / ${data.total}</p>
        <p><strong>Percentage:</strong> ${data.score}%</p>
        <p><strong>Date:</strong> ${
          data.takenAt ? new Date(data.takenAt).toLocaleString() : "N/A"
        }</p>
      `;
      resultsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching results:", err);
    if (noResultsText) {
      noResultsText.textContent = "Error loading test results. Please try again.";
      noResultsText.style.display = "block";
    }
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
});
