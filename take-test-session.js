import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let testData = null;
let currentQuestionIndex = 0;
let studentAnswers = [];

const testId = localStorage.getItem("selectedTestId"); // assumed to be set from take-test.html
const testTitleEl = document.getElementById("test-title");
const questionBox = document.getElementById("question-box");

async function loadTest() {
  if (!testId) {
    testTitleEl.textContent = "No test selected.";
    return;
  }

  const testRef = doc(db, "tests", testId);
  const testSnap = await getDoc(testRef);

  if (!testSnap.exists()) {
    testTitleEl.textContent = "Test not found.";
    return;
  }

  testData = testSnap.data();
  testTitleEl.textContent = testData.title || "Unnamed Test";
  studentAnswers = new Array(testData.questions.length).fill(null);
  renderQuestion();
}

function renderQuestion() {
  const question = testData.questions[currentQuestionIndex];
  questionBox.innerHTML = `
    <div class="question-card">
      <h2>Q${currentQuestionIndex + 1}: ${question.text}</h2>
      <div class="options">
        ${Object.entries(question.options).map(([key, value]) => `
          <input type="radio" id="${key}" name="option" value="${key}" ${studentAnswers[currentQuestionIndex] === key ? "checked" : ""}>
          <label for="${key}">${key}. ${value}</label>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('input[name="option"]').forEach(input => {
    input.addEventListener('change', () => {
      studentAnswers[currentQuestionIndex] = input.value;
    });
  });

  document.getElementById("prev-btn").disabled = currentQuestionIndex === 0;
  document.getElementById("next-btn").disabled = currentQuestionIndex === testData.questions.length - 1;
}

document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (currentQuestionIndex < testData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
});

document.getElementById("submit-btn").addEventListener("click", () => {
  const total = testData.questions.length;
  let correct = 0;

  testData.questions.forEach((q, i) => {
    if (studentAnswers[i] === q.correct) correct++;
  });

  const percentage = ((correct / total) * 100).toFixed(2);
  alert(`You scored ${correct}/${total} (${percentage}%)`);
  // Here you can save results to Firebase if needed
});

loadTest();
function calculateScoreAndSubmit() {
  // Example scoring logic
  let score = 0;
  const total = currentTest.questions.length;

  currentTest.questions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && selected.value === q.correct) {
      score++;
    }
  });

  submitTest(score, total);
}
function submitTest(score, total) {
  const resultContainer = document.getElementById("result-container");
  resultContainer.style.display = "block";
  resultContainer.innerHTML = `
    <h2>✅ Test Submitted!</h2>
    <p>Your Score: <strong>${score}</strong> out of <strong>${total}</strong></p>
    <p>You’ll be redirected to your dashboard shortly...</p>
  `;

  // Redirect after 4 seconds
  setTimeout(() => {
    window.location.href = "student.html";
  }, 4000);
}

