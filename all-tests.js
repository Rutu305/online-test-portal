import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
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
      <button data-id="${docSnap.id}" data-title="${data.title}" class="view-participants">View Participants</button>
    `;
    testList.appendChild(card);
  });

  document.querySelectorAll(".view-participants").forEach(button => {
    button.addEventListener("click", (e) => {
      const testId = e.target.getAttribute("data-id");
      const testTitle = e.target.getAttribute("data-title");
      showParticipants(testId, testTitle);
    });
  });
}

async function showParticipants(testId, testTitle) {
  try {
    participantList.innerHTML = "<p>Loading...</p>";
    document.getElementById("participantModal").style.display = "flex";
    document.getElementById("modalTitle").innerText = `Participants - ${testTitle}`;

    const q = query(collection(db, "results"), where("testId", "==", testId));
    const snap = await getDocs(q);

    if (snap.empty) {
      participantList.innerHTML = "<p>No participants found.</p>";
      return;
    }

    let html = "";

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const uid = data.uid;
      const score = data.score || "0";
      const takenAt = data.takenAt?.seconds
        ? new Date(data.takenAt.seconds * 1000).toLocaleString()
        : "Unknown Date";

      // Fetch name from users collection
      let name = "Unknown";
      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          name = userSnap.data().name || "No Name";
        }
      } catch (e) {
        console.warn(`Failed to get name for UID: ${uid}`, e);
      }

      html += `
        <div class="participant-card">
          <h4>👤 ${name}</h4>
          <p>📝 Score: ${score}</p>
          <p>📅 Taken At: ${takenAt}</p>
        </div>
      `;
    }

    participantList.innerHTML = html;

  } catch (err) {
    console.error("Error fetching participants:", err);
    participantList.innerHTML = "<p>Error loading participants.</p>";
  }
}

loadTests();
