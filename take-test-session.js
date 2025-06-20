import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

// Firebase Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const testId = localStorage.getItem("selectedTestId");
const testTitleEl = document.getElementById("test-title");
const questionBox = document.getElementById("question-box");
const timerEl = document.getElementById("timer");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");

// State
let testData = null;
let currentQuestionIndex = 0;
let studentAnswers = [];
let timerInterval = null;

// Load test after auth
onAuthStateChanged(auth, user => {
  if (!user) {
    alert("Please login again.");
    window.location.href = "login.html";
  } else {
    loadTest();
  }
});

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
  if (!testData.questions || testData.questions.length === 0) {
    testTitleEl.textContent = "No questions in this test.";
    return;
  }

  testTitleEl.textContent = testData.title || "Unnamed Test";
  studentAnswers = new Array(testData.questions.length).fill(null);

  startTimer((testData.duration || 10) * 60);
  renderQuestion();
}

function startTimer(seconds) {
  updateTimerDisplay(seconds);
  timerInterval = setInterval(() => {
    seconds--;
    updateTimerDisplay(seconds);
    if (seconds <= 0) {
      clearInterval(timerInterval);
      submitResult(true);
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  timerEl.textContent = `⏰ Time Left: ${min}:${sec.toString().padStart(2, '0')}`;
}

function renderQuestion() {
  const q = testData.questions[currentQuestionIndex];

  questionBox.innerHTML = `
    <div class="question-card">
      <h2>Q${currentQuestionIndex + 1}: ${q.text}</h2>
      <div class="options">
        ${['A', 'B', 'C', 'D'].map(opt => `
          <div class="option-item">
            <input type="radio" id="option-${opt}" name="option" value="${opt}"
              ${studentAnswers[currentQuestionIndex] === opt ? "checked" : ""}>
            <label for="option-${opt}">${opt}. ${q.options[opt]}</label>
          </div>`).join("")}
      </div>
    
      <div id="save-status" class="save-status"></div>
    </div>
  `;

  // Enable/disable nav buttons
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === testData.questions.length - 1;

  // Save button logic
  document.getElementById("save-btn").addEventListener("click", () => {
    const selected = document.querySelector('input[name="option"]:checked');
    const status = document.getElementById("save-status");

    if (!selected) {
      status.innerHTML = `<span style="color: red;">⚠️ Please select an option first.</span>`;
      return;
    }

    studentAnswers[currentQuestionIndex] = selected.value;
    status.innerHTML = `<span style="color: green;">✅ Saved "${selected.value}"</span>`;
  });
}

// Navigation buttons
prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex < testData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
});

// Submit button
submitBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  submitResult(false);
});

// Submit Result
async function submitResult(autoSubmitted = false) {
  const user = auth.currentUser;
  if (!user) {
    alert("Not logged in");
    window.location.href = "login.html";
    return;
  }

  const total = testData.questions.length;
  let correct = 0;

  testData.questions.forEach((q, i) => {
    if (studentAnswers[i] === q.correct) correct++;
  });

  const percentage = ((correct / total) * 100).toFixed(2);

  try {
    const resultRef = doc(db, "results", `${user.uid}_${testId}`);
    await setDoc(resultRef, {
      uid: user.uid,
      testId,
      testTitle: testData.title || "Untitled Test",
      correct,
      total,
      score: percentage,
      takenAt: serverTimestamp()
    });

    questionBox.innerHTML = `
      <div class="result-box">
        <h2>🎉 Test Submitted!</h2>
        <p>Score: <strong>${correct}</strong> / <strong>${total}</strong></p>
        <p>Percentage: <strong>${percentage}%</strong></p>
        ${autoSubmitted ? "<p>⏰ Auto-submitted due to timeout.</p>" : ""}
        <p>Redirecting to dashboard...</p>
      </div>
    `;

    document.getElementById("navigation").style.display = "none";
    setTimeout(() => {
      window.location.href = "student.html";
    }, 4000);

  } catch (err) {
    console.error("Error submitting test:", err);
    alert("Submission failed. Try again.");
  }
}
