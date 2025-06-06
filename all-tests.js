import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  collectionGroup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testList = document.getElementById("testList");
const participantList = document.getElementById("participantList");

async function loadTests() {
  const snapshot = await getDocs(collection(db, "tests"));
  if (snapshot.empty) {
    testList.innerHTML = "<p>No tests found.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "test-card";
    card.innerHTML = `
      <h3>${data.title}</h3>
      <p><strong>Duration:</strong> ${data.duration} mins</p>
      <p><strong>Total Questions:</strong> ${data.totalQuestions || data.questions?.length || 0}</p>
      <button data-id="${docSnap.id}" class="view-participants">View Participants</button>
    `;
    testList.appendChild(card);
  });

  document.querySelectorAll(".view-participants").forEach(button => {
    button.addEventListener("click", (e) => {
      const testId = e.target.getAttribute("data-id");
      showParticipants(testId);
    });
  });
}

async function showParticipants(testId) {
  participantList.innerHTML = "<p>Loading...</p>";
  document.getElementById("participantModal").style.display = "block";

  const resultsRef = collection(db, `tests/${testId}/results`);
  const resultsSnap = await getDocs(resultsRef);

  if (resultsSnap.empty) {
    participantList.innerHTML = "<p>No participants found.</p>";
    return;
  }

  let html = "<ul>";
  resultsSnap.forEach(doc => {
    const data = doc.data();
    html += `<li><strong>${data.username}</strong>: ${data.score}</li>`;
  });
  html += "</ul>";

  participantList.innerHTML = html;
}

loadTests();
