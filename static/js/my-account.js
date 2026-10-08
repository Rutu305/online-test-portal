// My Account script with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", async () => {
  const nameEl = document.getElementById("student-name");
  const emailEl = document.getElementById("account-email");
  const accNameEl = document.getElementById("account-name");
  const testCountBar = document.getElementById("test-count-bar");
  const averageScoreBar = document.getElementById("average-score-bar");
  const signOutBtn = document.getElementById("signOutBtn");

  try {
    const res = await fetch("/api/student/account");
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
        return;
      }
      throw new Error("Failed to load account");
    }

    const userData = await res.json();
    const name = userData.name || "Student";
    const email = userData.email || "";
    const totalTests = userData.totalTests || 0;
    const avgScore = userData.averageScore || 0;

    if (nameEl) nameEl.textContent = name;
    if (accNameEl) accNameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    if (testCountBar) {
      testCountBar.style.width = `${Math.min(totalTests * 20, 100)}%`;
      testCountBar.textContent = `${totalTests} Test${totalTests === 1 ? "" : "s"}`;
    }

    if (averageScoreBar) {
      averageScoreBar.style.width = `${avgScore}%`;
      averageScoreBar.textContent = `${avgScore}%`;
    }
  } catch (err) {
    console.error("Account error:", err);
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout error:", err);
      }
      window.location.href = "/login";
    });
  }
});
