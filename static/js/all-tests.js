// Admin All Tests JavaScript with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", () => {
  const testList = document.getElementById("testList");
  const participantList = document.getElementById("participantList");
  const participantModal = document.getElementById("participantModal");
  const modalTitle = document.getElementById("modalTitle");
  const closeModalBtn = document.getElementById("closeModalBtn");

  async function loadTests() {
    if (!testList) return;
    testList.innerHTML = "<p>Loading tests...</p>";

    try {
      const response = await fetch("/api/admin/tests");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch tests");
      }

      const tests = await response.json();
      testList.innerHTML = "";

      if (!tests || tests.length === 0) {
        testList.innerHTML = "<p>No tests found. Click 'Create Test' to add one.</p>";
        return;
      }

      tests.forEach((test) => {
        const card = document.createElement("div");
        card.className = "test-card";
        card.innerHTML = `
          <h3>${escapeHtml(test.title)}</h3>
          <p><strong>Duration:</strong> ${test.duration} mins</p>
          <p><strong>Total Questions:</strong> ${test.total_questions || test.questions_count || 0}</p>
          <p><strong>Participants:</strong> ${test.participant_count || 0}</p>
          <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
            <button data-id="${test.id}" data-title="${escapeHtml(test.title)}" class="view-participants" style="flex:1;">View Participants</button>
            <button data-id="${test.id}" class="delete-test-btn" style="background:#e53935;color:white;border:none;padding:10px 14px;border-radius:8px;cursor:pointer;">Delete</button>
          </div>
        `;
        testList.appendChild(card);
      });

      // Bind View Participants
      document.querySelectorAll(".view-participants").forEach((button) => {
        button.addEventListener("click", (e) => {
          const testId = e.currentTarget.getAttribute("data-id");
          const title = e.currentTarget.getAttribute("data-title");
          showParticipants(testId, title);
        });
      });

      // Bind Delete
      document.querySelectorAll(".delete-test-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const testId = e.currentTarget.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this test? All questions and submissions for this test will also be deleted.")) {
            try {
              const res = await fetch(`/api/admin/tests/${testId}`, { method: "DELETE" });
              const result = await res.json();
              if (res.ok && result.success) {
                alert("Test deleted successfully.");
                loadTests();
              } else {
                alert(result.message || "Failed to delete test.");
              }
            } catch (err) {
              console.error("Delete error:", err);
              alert("Error deleting test.");
            }
          }
        });
      });
    } catch (err) {
      console.error("Error loading tests:", err);
      testList.innerHTML = "<p>Failed to load tests. Try again later.</p>";
    }
  }

  async function showParticipants(testId, testTitle) {
    if (!participantList || !participantModal) return;
    participantList.innerHTML = "<p>Loading participants...</p>";
    participantModal.style.display = "flex";
    if (modalTitle) modalTitle.innerText = `Participants - ${testTitle}`;

    try {
      const response = await fetch(`/api/admin/tests/${testId}/participants`);
      const participants = await response.json();

      if (!participants || participants.length === 0) {
        participantList.innerHTML = "<p>No participants have taken this test yet.</p>";
        return;
      }

      let html = "";
      participants.forEach((p) => {
        const dateStr = p.taken_at ? new Date(p.taken_at).toLocaleString() : "N/A";
        html += `
          <div class="participant-card" style="background:#f8f9fa;padding:14px;border-radius:10px;margin-bottom:12px;border-left:4px solid #4F46E5;">
            <h4>👤 ${escapeHtml(p.name)} <small style="color:#666;font-weight:normal;">(${escapeHtml(p.email)})</small></h4>
            <p>📝 <strong>Score:</strong> ${p.correct_count} / ${p.total_questions} (${p.score}%)</p>
            <p>📅 <strong>Taken At:</strong> ${dateStr}</p>
          </div>
        `;
      });

      participantList.innerHTML = html;
    } catch (err) {
      console.error("Error fetching participants:", err);
      participantList.innerHTML = "<p>Error loading participants.</p>";
    }
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (participantModal) participantModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (participantModal && e.target === participantModal) {
      participantModal.style.display = "none";
    }
  });

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loadTests();
});
