// Create Test JavaScript with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createTestForm");
  const questionsContainer = document.getElementById("questionsContainer");
  const addQuestionBtn = document.getElementById("addQuestionBtn");
  const backToDashboardBtn = document.getElementById("backToDashboardBtn");

  function addQuestion() {
    const index = questionsContainer.children.length + 1;
    const block = document.createElement("div");
    block.className = "question-block";
    block.id = `question-block-${index}`;
    block.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h4>Question ${index}</h4>
        <button type="button" class="remove-q-btn" style="background:#e53935;color:white;padding:4px 10px;font-size:12px;border-radius:4px;cursor:pointer;border:none;">Remove</button>
      </div>
      <input type="text" class="questionText" placeholder="Enter Question" required />
      <input type="text" class="option1" placeholder="Option 1 (A)" required />
      <input type="text" class="option2" placeholder="Option 2 (B)" required />
      <input type="text" class="option3" placeholder="Option 3 (C)" required />
      <input type="text" class="option4" placeholder="Option 4 (D)" required />
      <label style="display:block;margin-top:6px;font-size:13px;color:#555;">Correct Option (1 for A, 2 for B, 3 for C, 4 for D):</label>
      <input type="number" class="correctAnswer" placeholder="Correct Option Number (1-4)" min="1" max="4" required />
    `;

    block.querySelector(".remove-q-btn").addEventListener("click", () => {
      block.remove();
      updateQuestionNumbers();
    });

    questionsContainer.appendChild(block);
    updateTotalQuestionsCount();
  }

  function updateQuestionNumbers() {
    const blocks = questionsContainer.querySelectorAll(".question-block");
    blocks.forEach((block, idx) => {
      block.querySelector("h4").textContent = `Question ${idx + 1}`;
    });
    updateTotalQuestionsCount();
  }

  function updateTotalQuestionsCount() {
    const count = questionsContainer.children.length;
    const totalQuestionsInput = document.getElementById("totalQuestions");
    if (totalQuestionsInput) {
      totalQuestionsInput.value = count;
    }
  }

  if (addQuestionBtn) {
    addQuestionBtn.addEventListener("click", addQuestion);
  }

  // Pre-add 1 question block by default if empty
  if (questionsContainer && questionsContainer.children.length === 0) {
    addQuestion();
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("testTitle").value.trim();
      const duration = parseInt(document.getElementById("testDuration").value, 10);
      const questionBlocks = document.querySelectorAll(".question-block");

      if (questionBlocks.length === 0) {
        alert("Please add at least one question to the test.");
        return;
      }

      const questions = [];
      const optionLetters = ["A", "B", "C", "D"];

      for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i];
        const questionText = block.querySelector(".questionText").value.trim();
        const opt1 = block.querySelector(".option1").value.trim();
        const opt2 = block.querySelector(".option2").value.trim();
        const opt3 = block.querySelector(".option3").value.trim();
        const opt4 = block.querySelector(".option4").value.trim();
        const correctNum = parseInt(block.querySelector(".correctAnswer").value, 10);

        if (!questionText || !opt1 || !opt2 || !opt3 || !opt4) {
          alert(`Please fill in all options for Question ${i + 1}.`);
          return;
        }

        if (isNaN(correctNum) || correctNum < 1 || correctNum > 4) {
          alert(`Correct option for Question ${i + 1} must be between 1 and 4.`);
          return;
        }

        questions.push({
          text: questionText,
          options: {
            A: opt1,
            B: opt2,
            C: opt3,
            D: opt4
          },
          correct: optionLetters[correctNum - 1]
        });
      }

      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving Test...";

      try {
        const response = await fetch("/api/admin/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            duration: duration || 10,
            totalQuestions: questions.length,
            questions
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert("🎉 Test and questions saved successfully!");
          form.reset();
          questionsContainer.innerHTML = "";
          addQuestion();
        } else {
          alert(data.message || "Failed to save test.");
        }
      } catch (err) {
        console.error("Error saving test:", err);
        alert("Error saving test. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener("click", () => {
      window.location.href = "/admin";
    });
  }
});
