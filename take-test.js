import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load available tests and display them as cards
async function loadTests() {
  const testList = document.getElementById("test-list");
  testList.innerHTML = "<p>Loading tests...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "tests"));
    testList.innerHTML = ""; // Clear the loading text

    if (querySnapshot.empty) {
      testList.innerHTML = "<p>No tests available.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const test = doc.data();
      const testId = doc.id;

      const card = document.createElement("div");
      card.className = "test-card";

      card.innerHTML = `
        <div class="test-title">${test.title || "Untitled Test"}</div>
        <div class="test-info">Questions: ${test.questions?.length || 0}</div>
        <div class="test-info">Duration: ${test.duration || "N/A"} min</div>
        <button class="start-btn" data-id="${testId}">Start Test</button>
      `;

      card.querySelector("button").addEventListener("click", () => startTest(testId));
      testList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading tests:", error);
    testList.innerHTML = "<p>Failed to load tests. Try again later.</p>";
  }
}

// Navigate to the test-taking session and save selected test ID
function startTest(testId) {
  localStorage.setItem("selectedTestId", testId);
  window.location.href = "take-test-session.html"; // Your test-taking page
}

// Start loading tests when the page loads
window.addEventListener("DOMContentLoaded", loadTests);

function goBackToDashboard() {
  window.location.href = "student.html";
}

// Make sure this function is in the global scope
window.goBackToDashboard = goBackToDashboard;
