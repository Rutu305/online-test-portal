import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

async function fetchTestsFromFirebase() {
  const content = document.getElementById("main-content");
  content.innerHTML = "<h2>Loading tests...</h2>";

  try {
    const querySnapshot = await getDocs(collection(db, "tests"));
    const tests = [];
    querySnapshot.forEach((doc) => {
      tests.push(doc.data());
    });
    renderTests(tests);
  } catch (error) {
    content.innerHTML = "<p>Error loading tests.</p>";
    console.error("Error fetching tests:", error);
  }
}

function renderTests(tests) {
  const container = document.getElementById("main-content");
  container.innerHTML = "<h2>My Tests</h2>";

  tests.forEach(test => {
    const card = document.createElement("div");
    card.className = "test-card";
    card.innerHTML = `
      <div class="status">${test.status || "STATUS UNKNOWN"}</div>
      <div class="title">${test.title}</div>
      <div class="desc">${test.description || "(no description)"}</div>
      <div class="meta">Created: ${test.created || "Unknown date"}</div>
      ${test.score ? `<div class="meta">Score: ${test.score}, Results: ${test.results || 0}</div>` : ""}
      <div class="tag">${test.tag || "UNCATEGORIZED"}</div>
    `;
    container.appendChild(card);
  });
}

function navigateTo(section) {
  const content = document.getElementById("main-content");

  switch (section) {
    case 'tests':
      fetchTestsFromFirebase();
      break;
    case 'results':
      content.innerHTML = "<h2>Results Database</h2><p>Coming soon...</p>";
      break;
    case 'account':
      content.innerHTML = "<h2>My Account</h2><p>Account info here...</p>";
      break;
    case 'home':
      content.innerHTML = "<h2>Welcome to TestPortal</h2><p>This is your dashboard.</p>";
      break;
    case 'help':
      content.innerHTML = "<h2>Help</h2><p>Contact support or FAQs here.</p>";
      break;
  }
}

function signOut() {
  alert("Signed out.");
  window.location.href = "login.html";
}

// Load default on page load
window.onload = () => navigateTo('tests');
