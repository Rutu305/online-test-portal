import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

async function renderStudentStats(data) {
  const content = document.getElementById("main-content");

  let recentHTML = "<p>No recent activity found.</p>";

  const user = auth.currentUser;
  if (user) {
    try {
      const resultsSnapshot = await getDocs(collection(db, "results"));
      let userResults = [];

      resultsSnapshot.forEach(doc => {
        const result = doc.data();
        if (result.uid === user.uid) {
          userResults.push(result);
        }
      });

      userResults.sort((a, b) => b.date?.seconds - a.date?.seconds);
      const recent = userResults.slice(0, 3);

      if (recent.length > 0) {
        recentHTML = "<ul class='recent-activity'>" + recent.map(r => `
          <li>📘 ${r.testTitle || "Untitled"} - <strong>${r.score || 0}%</strong> on ${r.date ? new Date(r.date.seconds * 1000).toLocaleDateString() : "N/A"}</li>
        `).join('') + "</ul>";
      }

    } catch (err) {
      console.error("Failed to fetch recent activity:", err);
    }
  }

  content.innerHTML = `
    <h2 style="text-align:center;">Welcome to Your Dashboard 👋</h2>

    <div class="stats-grid">
      <div class="stat-card tests"><h2>${data.totalTests}</h2><p>Total Tests</p></div>
      <div class="stat-card score"><h2>${data.averageScore}%</h2><p>Average Score</p></div>
      <div class="stat-card completed"><h2>${data.completedTests}</h2><p>Completed Tests</p></div>
    </div>

    <div class="home-extras">
      <h3>📈 Recent Activity</h3>
      ${recentHTML}

      <blockquote class="quote">
        “The beautiful thing about learning is nobody can take it away from you.” — B.B. King
      </blockquote>

      <div class="action-buttons">
        <button onclick="navigateTo('tests')">📄 Take a Test</button>
        <button onclick="navigateTo('results')">📊 View Results</button>
      </div>
    </div>
  `;
}



function navigateTo(section) {
  switch (section) {
    case 'tests':
      fetchTestsFromFirebase();
      break;
    case 'results':
  renderResultsDatabase();
  break;

  case 'account':
  const currentUser = auth.currentUser;
  if (currentUser) {
    const docRef = doc(db, "users", currentUser.uid);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        renderStudentAccount(docSnap.data());
      } else {
        document.getElementById("main-content").innerHTML = "<p>Account data not found.</p>";
      }
    }).catch((error) => {
      document.getElementById("main-content").innerHTML = "<p>Error loading account info.</p>";
      console.error("Account fetch error:", error);
    });
  } else {
    document.getElementById("main-content").innerHTML = "<p>User not signed in.</p>";
  }
  break;



    case 'home':
      const stats = {
        totalTests: 14,
        averageScore: 78,
        completedTests: 9
      };
      renderStudentStats(stats);
      break;
    case 'help':
      document.getElementById("main-content").innerHTML = "<h2>Help</h2><p>Contact support or FAQs here.</p>";
      break;
  }
}
window.navigateTo = navigateTo;

function signOutUser() {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("userRole");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Sign-out error:", error.message);
      alert("Error signing out. Try again.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash === "#home") {
    navigateTo("home");
  } else if (hash === "#tests") {
    navigateTo("tests");
  } else {
    navigateTo("home"); // Default
  }
});

function renderStudentAccount(userData) {
  const content = document.getElementById("main-content");
  const timestamp = userData.createdAt;
  const joinedDate = timestamp && timestamp.seconds
    ? new Date(timestamp.seconds * 1000).toDateString()
    : "N/A";

  content.innerHTML = `
    <div class="account-section">
      <h2>👤 My Profile</h2>
      <div class="account-info">
        <div><strong>Name:</strong> <span>${userData.name || "N/A"}</span></div>
        <div><strong>Email:</strong> <span>${userData.email || "N/A"}</span></div>
        <div><strong>Role:</strong> <span>${userData.role || "student"}</span></div>
        <div><strong>Joined:</strong> <span>${joinedDate}</span></div>
      </div>
    </div>
  `;
}

 

async function renderResultsDatabase() {
  const content = document.getElementById("main-content");
  content.innerHTML = "<h2>Results Database</h2><div class='results-table'><p>Loading results...</p></div>";

  const user = auth.currentUser;
  if (!user) return content.innerHTML = "<p>User not signed in.</p>";

  try {
    const resultsSnapshot = await getDocs(collection(db, "results"));
    let userResults = [];

    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.uid === user.uid) {
        userResults.push(data);
      }
    });

    if (userResults.length === 0) {
      content.innerHTML = "<h2>Results Database</h2><p>No test results found.</p>";
      return;
    }

    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Test Title</th>
            <th>Score</th>
            <th>Date Taken</th>
          </tr>
        </thead>
        <tbody>
          ${userResults.map(result => `
            <tr>
              <td>${result.testTitle || "N/A"}</td>
              <td>${result.score || 0}%</td>
              <td>${result.date ? new Date(result.date.seconds * 1000).toLocaleDateString() : "N/A"}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    content.innerHTML = "<h2>Results Database</h2>" + tableHTML;
  } catch (error) {
    console.error("Error loading results:", error);
    content.innerHTML = "<p>Error loading results.</p>";
  }
}


window.navigateTo = navigateTo;

