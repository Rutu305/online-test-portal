// Admin Dashboard JavaScript with Flask backend (No Firebase)
document.addEventListener("DOMContentLoaded", () => {
  // Load current user profile info
  fetch("/api/me")
    .then(res => res.json())
    .then(data => {
      if (data && data.user) {
        const nameEl = document.getElementById("admin-name");
        const emailEl = document.getElementById("admin-email");
        if (nameEl) nameEl.textContent = data.user.name || "Admin";
        if (emailEl) emailEl.textContent = data.user.email || "admin@test.com";
      }
    })
    .catch(err => console.error("Error fetching user:", err));

  // Load Dashboard Stats
  async function loadDashboardStats() {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch admin stats");
      }

      const data = await response.json();
      animateCounter("testCount", data.testCount || 0);
      animateCounter("studentCount", data.studentCount || 0);
      animateCounter("submissionCount", data.submissionCount || 0);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  }

  function animateCounter(id, endValue) {
    const el = document.getElementById(id);
    if (!el) return;
    if (endValue === 0) {
      el.textContent = "0";
      return;
    }
    let current = 0;
    const increment = Math.max(1, Math.ceil(endValue / 30));
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

  // Dashboard refresh
  const dashboardBtn = document.getElementById("dashboardBtn");
  dashboardBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loadDashboardStats();
  });

  // Sign out
  const signOutBtn = document.getElementById("signOutBtn");
  signOutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    window.location.href = "/login";
  });
});
