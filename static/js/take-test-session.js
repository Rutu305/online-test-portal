// Take Test Session JavaScript with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get("test_id") || urlParams.get("id") || localStorage.getItem("selectedTestId");

  const testTitleEl = document.getElementById("test-title");
  const questionBox = document.getElementById("question-box");
  const timerEl = document.getElementById("timer");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const saveBtn = document.getElementById("save-btn");
  const submitBtn = document.getElementById("submit-btn");
  const navContainer = document.getElementById("navigation");

  let testData = null;
  let currentQuestionIndex = 0;
  let studentAnswers = [];
  let timerInterval = null;
  let isSubmitted = false;

  async function loadTest() {
    if (!testId) {
      if (testTitleEl) testTitleEl.textContent = "No test selected.";
      alert("No test selected. Redirecting to available tests.");
      window.location.href = "/take-test";
      return;
    }

    try {
      const response = await fetch(`/api/student/test/${testId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Test not found");
      }

      testData = await response.json();

      if (!testData.questions || testData.questions.length === 0) {
        if (testTitleEl) testTitleEl.textContent = "No questions found in this test.";
        return;
      }

      if (testTitleEl) testTitleEl.textContent = testData.title || "Online Examination";
      studentAnswers = new Array(testData.questions.length).fill(null);

      // Start countdown timer
      const durationSeconds = (testData.duration || 10) * 60;
      startTimer(durationSeconds);

      // Render Question Palette
      renderPalette();

      // Render First Question
      renderQuestion();
    } catch (err) {
      console.error("Error loading test:", err);
      if (testTitleEl) testTitleEl.textContent = "Error loading test details.";
    }
  }

  function startTimer(seconds) {
    let remaining = seconds;
    updateTimerDisplay(remaining);

    timerInterval = setInterval(() => {
      remaining--;
      updateTimerDisplay(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (!isSubmitted) {
          alert("⏰ Time is up! Your test will be auto-submitted now.");
          submitResult(true);
        }
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    if (!timerEl) return;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    timerEl.textContent = `⏰ Time Left: ${min}:${sec.toString().padStart(2, "0")}`;

    if (seconds < 120) {
      timerEl.style.color = "#d32f2f";
      timerEl.style.fontWeight = "bold";
    }
  }

  function renderPalette() {
    let paletteContainer = document.getElementById("question-palette");
    if (!paletteContainer) {
      paletteContainer = document.createElement("div");
      paletteContainer.id = "question-palette";
      paletteContainer.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:15px 0;";
      if (questionBox && questionBox.parentNode) {
        questionBox.parentNode.insertBefore(paletteContainer, questionBox);
      }
    }

    paletteContainer.innerHTML = "";
    testData.questions.forEach((_, idx) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.textContent = idx + 1;
      const isAnswered = studentAnswers[idx] !== null;
      const isCurrent = idx === currentQuestionIndex;

      pill.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid ${isCurrent ? "#1976d2" : "#ccc"};
        background-color: ${isCurrent ? "#bbdefb" : isAnswered ? "#c8e6c9" : "#fff"};
        color: ${isCurrent ? "#0d47a1" : isAnswered ? "#2e7d32" : "#333"};
        font-weight: bold;
        cursor: pointer;
        transition: 0.2s;
      `;

      pill.addEventListener("click", () => {
        saveCurrentSelection();
        currentQuestionIndex = idx;
        renderQuestion();
      });

      paletteContainer.appendChild(pill);
    });
  }

  function renderQuestion() {
    if (!testData || !testData.questions) return;
    const q = testData.questions[currentQuestionIndex];
    const totalQ = testData.questions.length;

    questionBox.innerHTML = `
      <div class="question-card" style="background:#fdfdfd;padding:25px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="font-size:13px;color:#718096;margin-bottom:8px;font-weight:600;">Question ${currentQuestionIndex + 1} of ${totalQ}</div>
        <h2 style="font-size:1.3rem;color:#2d3748;margin-bottom:20px;">${escapeHtml(q.text)}</h2>
        <div class="options">
          ${["A", "B", "C", "D"].map((opt) => `
            <div class="option-item" style="margin:10px 0;">
              <input type="radio" id="option-${opt}" name="option" value="${opt}"
                ${studentAnswers[currentQuestionIndex] === opt ? "checked" : ""}>
              <label for="option-${opt}" style="display:block;padding:12px 16px;border-radius:8px;border:2px solid ${studentAnswers[currentQuestionIndex] === opt ? "#42a5f5" : "#e2e8f0"};background:${studentAnswers[currentQuestionIndex] === opt ? "#e3f2fd" : "#f7fafc"};cursor:pointer;">
                <strong>${opt}.</strong> ${escapeHtml(q.options[opt] || "")}
              </label>
            </div>
          `).join("")}
        </div>
        <div id="save-status" class="save-status" style="margin-top:12px;font-weight:600;"></div>
      </div>
    `;

    // Listen to radio changes to highlight
    const radios = questionBox.querySelectorAll('input[name="option"]');
    radios.forEach(radio => {
      radio.addEventListener("change", (e) => {
        studentAnswers[currentQuestionIndex] = e.target.value;
        const status = document.getElementById("save-status");
        if (status) status.innerHTML = `<span style="color: #2e7d32;">✅ Selected option ${e.target.value}</span>`;
        renderPalette();
      });
    });

    // Update Nav buttons state
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === totalQ - 1;

    renderPalette();
  }

  function saveCurrentSelection() {
    const selected = document.querySelector('input[name="option"]:checked');
    if (selected) {
      studentAnswers[currentQuestionIndex] = selected.value;
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const selected = document.querySelector('input[name="option"]:checked');
      const status = document.getElementById("save-status");
      if (!selected) {
        if (status) status.innerHTML = `<span style="color: #d32f2f;">⚠️ Please select an option first.</span>`;
        return;
      }
      studentAnswers[currentQuestionIndex] = selected.value;
      if (status) status.innerHTML = `<span style="color: #2e7d32;">✅ Answer saved (${selected.value})</span>`;
      renderPalette();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      saveCurrentSelection();
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      saveCurrentSelection();
      if (currentQuestionIndex < testData.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      saveCurrentSelection();
      const answeredCount = studentAnswers.filter(a => a !== null).length;
      const totalCount = testData.questions.length;
      const confirmMsg = answeredCount === totalCount
        ? `Are you sure you want to submit? You have answered all ${totalCount} questions.`
        : `You have answered ${answeredCount} of ${totalCount} questions. Unanswered questions will receive 0 marks. Submit now?`;

      if (confirm(confirmMsg)) {
        clearInterval(timerInterval);
        submitResult(false);
      }
    });
  }

  async function submitResult(autoSubmitted = false) {
    if (isSubmitted) return;
    isSubmitted = true;

    saveCurrentSelection();
    clearInterval(timerInterval);

    // Prepare answers payload
    const answersPayload = {};
    studentAnswers.forEach((ans, idx) => {
      answersPayload[idx] = ans;
    });

    try {
      const response = await fetch(`/api/student/test/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const correct = result.correct;
        const total = result.total;
        const percentage = result.percentage;

        questionBox.innerHTML = `
          <div class="result-box" style="text-align:center;padding:40px 20px;background:#f0fdf4;border-radius:14px;border:2px solid #86efac;">
            <h2 style="color:#15803d;font-size:2rem;margin-bottom:15px;">🎉 Test Submitted Successfully!</h2>
            <p style="font-size:1.2rem;margin:10px 0;">Score: <strong>${correct}</strong> / <strong>${total}</strong></p>
            <p style="font-size:1.4rem;color:#16a34a;font-weight:bold;margin:15px 0;">Percentage: ${percentage}%</p>
            ${autoSubmitted ? "<p style='color:#b91c1c;font-weight:600;'>⏰ Auto-submitted due to time limit expiration.</p>" : ""}
            <p style="color:#64748b;margin-top:20px;">Redirecting to your dashboard in a few seconds...</p>
            <a href="/student" style="display:inline-block;margin-top:15px;padding:10px 20px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Return to Dashboard Now</a>
          </div>
        `;

        const palette = document.getElementById("question-palette");
        if (palette) palette.style.display = "none";
        if (navContainer) navContainer.style.display = "none";
        if (timerEl) timerEl.style.display = "none";

        setTimeout(() => {
          window.location.href = "/student";
        }, 3500);
      } else {
        alert(result.message || "Failed to submit test.");
        isSubmitted = false;
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      alert("Submission error. Please check connection and try again.");
      isSubmitted = false;
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

  loadTest();
});
