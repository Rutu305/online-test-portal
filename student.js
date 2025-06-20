import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

// Firebase Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Realtime Dashboard Stats Function
async function renderStudentStats() {
  const content = document.getElementById("main-content");
  const user = auth.currentUser;

  if (!user) {
    content.innerHTML = "<p>Please log in.</p>";
    return;
  }

  try {
    const [testsSnap, resultsSnap] = await Promise.all([
      getDocs(collection(db, "tests")),
      getDocs(collection(db, "results"))
    ]);

    const totalTests = testsSnap.size;
    let completedTests = 0;
    let totalScore = 0;
    let scoreCount = 0;
    let recent = [];

    resultsSnap.forEach(doc => {
      const data = doc.data();
      if (data.uid === user.uid) {
        completedTests++;
        totalScore += parseFloat(data.score || 0);
        scoreCount++;
        recent.push(data);
      }
    });

    const averageScore = scoreCount ? (totalScore / scoreCount).toFixed(2) : 0;

    // Sort recent activity
    recent.sort((a, b) => (b.takenAt?.seconds || 0) - (a.takenAt?.seconds || 0));
    const recentHTML = recent.slice(0, 3).map(r => `
      <li>📝 ${r.testTitle || "Untitled"} - <strong>${r.score || 0}%</strong> on ${r.takenAt ? new Date(r.takenAt.seconds * 1000).toLocaleDateString() : "N/A"}</li>
    `).join('');

    content.innerHTML = `
      <h2 class="dashboard-title">🎓 Welcome to Your Dashboard</h2>

      <div class="chart-container">
        <canvas id="testsChart" width="300" height="300"></canvas>
        <canvas id="scoreChart" width="300" height="300"></canvas>
      </div>

      <div class="recent-activity">
        <h3>📌 Recent Activity</h3>
        <ul>${recentHTML || "<li>No recent activity.</li>"}</ul>
      </div>

      <div class="quote">
        <blockquote>“Success is the sum of small efforts, repeated day in and day out.”</blockquote>
      </div>

      <div class="actions">
        <a href="take-test.html"><button>🚀 Take New Test</button></a>
        <button onclick="navigateTo('results')">📊 View Results</button>
      </div>
    `;

    // Chart: Completed vs Remaining Tests
    new Chart(document.getElementById("testsChart"), {
      type: 'doughnut',
      data: {
        labels: ["Completed", "Remaining"],
        datasets: [{
          label: "Test Completion",
          data: [completedTests, totalTests - completedTests],
          backgroundColor: ["#4CAF50", "#FFCDD2"]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "📘 Test Completion"
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });

    // Chart: Average Score
    new Chart(document.getElementById("scoreChart"), {
      type: 'doughnut',
      data: {
        labels: ["Score", "Remaining"],
        datasets: [{
          label: "Average Score",
          data: [averageScore, 100 - averageScore],
          backgroundColor: ["#2196F3", "#E0E0E0"]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "📊 Avg. Score"
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    content.innerHTML = "<p>Error loading dashboard stats.</p>";
  }
}

// Fetch Tests
async function fetchTestsFromFirebase() {
  const content = document.getElementById("main-content");
  content.innerHTML = "<h2>Loading tests...</h2>";

  try {
    const querySnapshot = await getDocs(collection(db, "tests"));
    const tests = [];
    querySnapshot.forEach(doc => tests.push(doc.data()));
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

// Navigation Logic
function navigateTo(section) {
  switch (section) {
    case 'home':
      renderStudentStats();
      break;
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
        getDoc(docRef).then(docSnap => {
          if (docSnap.exists()) {
            renderStudentAccount(docSnap.data());
          } else {
            document.getElementById("main-content").innerHTML = "<p>Account data not found.</p>";
          }
        }).catch((error) => {
          document.getElementById("main-content").innerHTML = "<p>Error loading account info.</p>";
          console.error("Account fetch error:", error);
        });
      }
      break;
    case 'help':
      document.getElementById("main-content").innerHTML = "<h2>Help</h2><p>Contact support or FAQs here.</p>";
      break;
  }
}
window.navigateTo = navigateTo;

// Sign Out
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
window.signOutUser = signOutUser;

// Account Page
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

// Results Database Page
async function renderResultsDatabase() {
  const content = document.getElementById("main-content");
  content.innerHTML = "<h2>Results Database</h2><div class='results-table'><p>Loading results...</p></div>";

  const user = auth.currentUser;
  if (!user) {
    content.innerHTML = "<p>User not signed in.</p>";
    return;
  }

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
               <td>${result.takenAt ? new Date(result.takenAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>


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

// Initial Page Load
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const hash = window.location.hash;
      if (hash === "#tests") {
        navigateTo("tests");
      } else if (hash === "#results") {
        navigateTo("results");
      } else if (hash === "#account") {
        navigateTo("account");
      } else {
        navigateTo("home");
      }
    } else {
      document.getElementById("main-content").innerHTML = "<p>User not signed in.</p>";
    }
  });
});
