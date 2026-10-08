import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-conf.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const modal = document.getElementById("testModal");
const openModalBtn = document.getElementById("openTestModal");
const closeModalBtn = document.getElementById("closeModal");
const createTestForm = document.getElementById("createTestForm");
const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");

openModalBtn.onclick = () => modal.style.display = "block";
closeModalBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

addQuestionBtn.onclick = () => {
  const index = document.querySelectorAll(".question-block").length + 1;
  const block = document.createElement("div");
  block.className = "question-block";
  block.innerHTML = `
    <strong>Question ${index}</strong><br>
    <input type="text" placeholder="Question text" class="question" required /><br>
    <input type="text" placeholder="Option A" class="option" required />
    <input type="text" placeholder="Option B" class="option" required />
    <input type="text" placeholder="Option C" class="option" required />
    <input type="text" placeholder="Option D" class="option" required />
    <input type="text" placeholder="Correct Option (A/B/C/D)" class="correctOption" required />
    <hr />
  `;
  questionsContainer.appendChild(block);
};

createTestForm.onsubmit = async (e) => {
  e.preventDefault();

  const title = document.getElementById("testTitle").value.trim();
  const duration = parseInt(document.getElementById("testDuration").value);
  const totalQuestions = parseInt(document.getElementById("totalQuestions").value);

  const questionBlocks = document.querySelectorAll(".question-block");

  if (questionBlocks.length === 0) {
    alert("Please add at least one question.");
    return;
  }

  const questions = [];

  questionBlocks.forEach((block, index) => {
    const questionText = block.querySelector(".question")?.value.trim();
    const optionInputs = block.querySelectorAll(".option");
    const correct = block.querySelector(".correctOption")?.value.trim();

    const options = Array.from(optionInputs).map(input => input.value.trim());

    if (!questionText || options.length < 4 || options.some(o => !o) || !correct) {
      alert(`Please fill all fields for Question ${index + 1}`);
      throw new Error(`Invalid question data at question ${index + 1}`);
    }

    questions.push({ question: questionText, options, correct });
  });

  try {
    const testId = doc(collection(db, "tests")).id;
    await setDoc(doc(db, "tests", testId), {
      title,
      duration,
      totalQuestions,
      questions
    });

    alert("Test created successfully!");
    createTestForm.reset();
    questionsContainer.innerHTML = "";
    modal.style.display = "none";
  } catch (err) {
    console.error("🔥 Failed to save test:", err);
    alert("Error creating test. Check the console.");
  }
};
