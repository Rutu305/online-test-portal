document.addEventListener("DOMContentLoaded", () => {
  import("https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js").then(({ initializeApp }) => {
    import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js").then(({
      getFirestore, collection, getDocs
    }) => {
      import('./firebase-config.js').then(({ firebaseConfig }) => {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        async function loadDashboardStats() {
          try {
            const testsSnapshot = await getDocs(collection(db, "tests"));
            const studentsSnapshot = await getDocs(collection(db, "users"));
            
           
// Fetch all submissions
const submissionsSnapshot = await getDocs(collection(db, "submissions"));
const submissionCount = submissionsSnapshot.size;
 

            animateCounter("testCount", testsSnapshot.size);
            animateCounter("studentCount", studentsSnapshot.size);
            animateCounter("submissionCount", submissionCount);

          } catch (err) {
            console.error("Error loading dashboard data:", err);
          }
        }

        function animateCounter(id, endValue) {
          let current = 0;
          const increment = Math.ceil(endValue / 40);
          const el = document.getElementById(id);
          const interval = setInterval(() => {
            current += increment;
            if (current >= endValue) {
              el.textContent = endValue;
              clearInterval(interval);
            } else {
              el.textContent = current;
            }
          }, 30);
        }

        loadDashboardStats();

        // Handle navigation if needed later
        const dashboardBtn = document.getElementById("dashboardBtn");
        dashboardBtn?.addEventListener("click", (e) => {
          e.preventDefault();
          location.reload(); // Reloads dashboard view
        });

        // Signout functionality if needed
        const signOutBtn = document.getElementById("signOutBtn");
        signOutBtn?.addEventListener("click", () => {
          import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js").then(({ getAuth, signOut }) => {
            const auth = getAuth(app);
            signOut(auth).then(() => {
              window.location.href = "login.html";
            });
          });
        });
      });
    });
  });
});
