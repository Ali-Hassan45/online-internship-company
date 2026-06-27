/*
  AH Nexues Lab Internship Portal - Frontend + Backend Connected Version
  Backend: PHP + MySQL API
  Frontend: HTML + CSS + JavaScript

  Concepts included:
  OOP: APIService, Validator, ApplicationQueue, ActivityStack, SearchSorter
  PF: variables, arrays, loops, functions, conditions, form handling
  DSA: queue, stack, searching, insertion sort
  Database: MySQL backend stores users, internships, applications, notifications, activities and quiz scores
*/

const COMPANY_NAME = "AH Nexues Lab";
const API_BASE = "api";

let STATE = {
  user: null,
  internships: [],
  applications: [],
  notifications: [],
  activities: [],
  quizScores: [],
  stats: { users: 0, companies: 0, internships: 0, applications: 0 }
};

class APIService {
  static async get(url) {
    const res = await fetch(`${API_BASE}/${url}`, {
      method: "GET",
      credentials: "same-origin",
      headers: { "Accept": "application/json" }
    });
    return APIService.handle(res);
  }

  static async post(url, data = {}) {
    const res = await fetch(`${API_BASE}/${url}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    });
    return APIService.handle(res);
  }

  static async handle(res) {
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Backend returned invalid JSON. Run this project through XAMPP localhost.");
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }
}

class Validator {
  static fullName(v) {
    return /^[A-Za-z ]{3,80}$/.test(String(v || "").trim());
  }

  static username(v) {
    return /^[A-Za-z0-9_]{4,20}$/.test(String(v || "").trim());
  }

  static email(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  static phone(v) {
    return /^03[0-9]{9}$/.test(String(v || "").trim());
  }

  static dob(v) {
    if (!v) return false;
    const birth = new Date(v);
    const today = new Date();
    if (birth >= today) return false;

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    return age >= 13;
  }

  static password(v) {
    v = String(v || "");
    return (
      v.length >= 10 &&
      /[A-Z]/.test(v) &&
      /[a-z]/.test(v) &&
      /[0-9]/.test(v) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(v)
    );
  }

  static url(v) {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }
}

class ApplicationQueue {
  constructor(items = []) {
    this.queue = [...items];
  }
  enqueue(item) { this.queue.push(item); }
  dequeue() { return this.queue.shift(); }
  isEmpty() { return this.queue.length === 0; }
}

class ActivityStack {
  constructor(items = []) {
    this.stack = [...items];
  }
  push(item) { this.stack.push(item); }
  pop() { return this.stack.pop(); }
  isEmpty() { return this.stack.length === 0; }
}

class SearchSorter {
  static search(items, keyword, category) {
    const key = String(keyword || "").toLowerCase().trim();
    return items.filter(item => {
      const text = `${item.title} ${item.companyName} ${item.category} ${item.skills}`.toLowerCase();
      const keywordMatch = key === "" || text.includes(key);
      const categoryMatch = category === "all" || item.category === category;
      return keywordMatch && categoryMatch;
    });
  }

  static sort(items, sortBy) {
    const arr = [...items];

    // Insertion Sort for DSA explanation
    for (let i = 1; i < arr.length; i++) {
      const current = arr[i];
      let j = i - 1;

      while (j >= 0 && SearchSorter.compare(arr[j], current, sortBy) > 0) {
        arr[j + 1] = arr[j];
        j--;
      }

      arr[j + 1] = current;
    }

    return arr;
  }

  static compare(a, b, sortBy) {
    if (sortBy === "stipend") return Number(b.stipend) - Number(a.stipend);
    if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
    return new Date(a.deadline) - new Date(b.deadline);
  }
}

const $ = id => document.getElementById(id);

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
}

function clearError(id) {
  showError(id, "");
}

function idEq(a, b) {
  return String(a) === String(b);
}

async function loadState() {
  try {
    const data = await APIService.get("data.php?action=bootstrap");
    STATE.user = data.user;
    STATE.internships = data.internships || [];
    STATE.applications = data.applications || [];
    STATE.notifications = data.notifications || [];
    STATE.activities = data.activities || [];
    STATE.quizScores = data.quizScores || [];
    STATE.stats = data.stats || STATE.stats;
  } catch (err) {
    console.error(err);
    showBackendWarning(err.message);
  }
}

function showBackendWarning(message) {
  if (document.querySelector(".backend-warning")) return;

  const div = document.createElement("div");
  div.className = "alert error backend-warning";
  div.innerHTML = `<strong>Backend issue:</strong> ${htmlEscape(message)}<br>
  Make sure Apache/MySQL are running and open this project from <code>http://localhost/...</code>.`;
  const main = document.querySelector("main.container");
  if (main) main.prepend(div);
}

function requireLogin() {
  if (!STATE.user) {
    alert("Please login first.");
    location.href = "login.html";
    return null;
  }
  return STATE.user;
}

async function logout() {
  try {
    await APIService.post("auth.php?action=logout", {});
  } catch (err) {
    console.warn(err);
  }
  location.href = "login.html";
}

function updateNav() {
  const user = STATE.user;
  document.querySelectorAll(".guest-link").forEach(e => e.style.display = user ? "none" : "inline-flex");
  document.querySelectorAll(".auth-link").forEach(e => e.style.display = user ? "inline-flex" : "none");
  document.querySelectorAll(".company-link").forEach(e => e.style.display = user && user.role === "company" ? "inline-flex" : "none");
  document.querySelectorAll(".student-link").forEach(e => e.style.display = user && user.role === "student" ? "inline-flex" : "none");
}

function updateStatsOnHome() {
  if (!$("totalUsers")) return;
  $("totalUsers").textContent = STATE.stats.users || 0;
  $("totalCompanies").textContent = STATE.stats.companies || 0;
  $("totalInternships").textContent = STATE.stats.internships || 0;
  $("totalApplications").textContent = STATE.stats.applications || 0;
}

// Register
function initRegisterPage() {
  const form = $("registerForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    let valid = true;

    const fullName = $("full_name").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const username = $("username").value.trim();
    const dob = $("dob").value;
    const role = $("role").value;
    const password = $("password").value;
    const confirmPassword = $("confirm_password").value;

    if (!Validator.fullName(fullName)) { showError("fullNameError", "Full name must be 3-80 letters only."); valid = false; } else clearError("fullNameError");
    if (!Validator.email(email)) { showError("emailError", "Enter valid email with @ and domain."); valid = false; } else clearError("emailError");
    if (!Validator.phone(phone)) { showError("phoneError", "Phone must be Pakistani format: 03XXXXXXXXX."); valid = false; } else clearError("phoneError");
    if (!Validator.username(username)) { showError("usernameError", "Username must be 4-20 chars: letters, numbers, underscore."); valid = false; } else clearError("usernameError");
    if (!Validator.dob(dob)) { showError("dobError", "Minimum age 13 and DOB cannot be future."); valid = false; } else clearError("dobError");
    if (role !== "student" && role !== "company") { showError("roleError", "Select valid account type."); valid = false; } else clearError("roleError");
    if (!Validator.password(password)) { showError("passwordError", "Password must be 10+ chars with uppercase, lowercase, number and special character."); valid = false; } else clearError("passwordError");
    if (password !== confirmPassword || confirmPassword === "") { showError("confirmPasswordError", "Passwords do not match."); valid = false; } else clearError("confirmPasswordError");

    if (!valid) return;

    try {
      const data = await APIService.post("auth.php?action=register", {
        full_name: fullName, email, phone, username, dob, role, password, confirm_password: confirmPassword
      });

      STATE.user = data.user;
      alert("Registration successful! Data saved in MySQL database.");
      location.href = "dashboard.html";
    } catch (err) {
      if (err.message.toLowerCase().includes("email")) showError("emailError", err.message);
      else if (err.message.toLowerCase().includes("username")) showError("usernameError", err.message);
      else alert(err.message);
    }
  });
}

// Login
function initLoginPage() {
  const form = $("loginForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const identity = $("identity").value.trim();
    const password = $("password").value;

    if (!identity) { showError("identityError", "Email or username is required."); return; } else clearError("identityError");
    if (!password) { showError("passwordError", "Password is required."); return; } else clearError("passwordError");

    try {
      const data = await APIService.post("auth.php?action=login", { identity, password });
      STATE.user = data.user;
      alert("Login successful!");
      location.href = "dashboard.html";
    } catch (err) {
      showError("identityError", err.message);
    }
  });
}

function renderActivities(stack) {
  if (stack.isEmpty()) return `<div class="empty">No activity yet.</div>`;
  let output = "";
  while (!stack.isEmpty()) {
    const item = stack.pop();
    output += `<p>• ${htmlEscape(item.message)} <small>${htmlEscape(item.createdAt)}</small></p>`;
  }
  return output;
}

// Dashboard
function initDashboardPage() {
  const wrap = $("dashboardWrap");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const internships = STATE.internships;
  const applications = STATE.applications;
  const stack = new ActivityStack(STATE.activities);

  if (user.role === "student") {
    const myApplications = applications.filter(app => idEq(app.studentId, user.id));
    const savedInternships = internships.filter(item => (user.saved || []).some(id => idEq(id, item.id)));

    wrap.innerHTML = `
      <div class="section-title reveal">
        <span class="pill">Student Dashboard</span>
        <h2>Welcome, ${htmlEscape(user.fullName)}</h2>
        <p>Track applications, saved internships, interviews, certificates and activity at ${COMPANY_NAME}.</p>
      </div>

      <section class="stats reveal delay-1">
        <div class="card stat"><strong>${myApplications.length}</strong><span>Applications</span></div>
        <div class="card stat"><strong>${savedInternships.length}</strong><span>Saved</span></div>
        <div class="card stat"><strong>${STATE.notifications.length}</strong><span>Notifications</span></div>
        <div class="card stat"><strong>Student</strong><span>Role</span></div>
      </section>

      <section class="grid-3 reveal delay-2">
        <div class="panel">
          <h3>Quick Actions</h3>
          <div class="actions">
            <a class="btn btn-primary" href="internships.html">Find Internships</a>
            <a class="btn btn-ghost" href="profile.html">Edit Profile</a>
            <a class="btn btn-ghost" href="resume-builder.html">Resume Builder</a>
            <a class="btn btn-ghost" href="skill-quiz.html">Skill Quiz</a>
            <a class="btn btn-ghost" href="certificate.html">Certificate</a>
          </div>
        </div>

        <div class="panel">
          <h3>Student Profile</h3>
          <p><strong>Email:</strong> ${htmlEscape(user.email)}</p>
          <p><strong>Phone:</strong> ${htmlEscape(user.phone)}</p>
          <p><strong>Education:</strong> ${htmlEscape(user.education || "Not set")}</p>
          <p><strong>Skills:</strong> ${htmlEscape(user.skills || "Not set")}</p>
        </div>

        <div class="panel">
          <h3>Recent Activity Stack</h3>
          ${renderActivities(stack)}
        </div>
      </section>
    `;
  } else {
    const posted = internships.filter(item => idEq(item.companyId, user.id));
    const received = applications.filter(app => posted.some(item => idEq(item.id, app.internshipId)));

    wrap.innerHTML = `
      <div class="section-title reveal">
        <span class="pill">Company Dashboard</span>
        <h2>Welcome, ${htmlEscape(user.companyName || COMPANY_NAME)}</h2>
        <p>Post internships, manage applications, schedule interviews and review student progress.</p>
      </div>

      <section class="stats reveal delay-1">
        <div class="card stat"><strong>${posted.length}</strong><span>Posted</span></div>
        <div class="card stat"><strong>${received.length}</strong><span>Applications</span></div>
        <div class="card stat"><strong>${received.filter(a => a.status === "Accepted").length}</strong><span>Accepted</span></div>
        <div class="card stat"><strong>${COMPANY_NAME}</strong><span>Company</span></div>
      </section>

      <section class="grid-3 reveal delay-2">
        <div class="panel">
          <h3>Quick Actions</h3>
          <div class="actions">
            <a class="btn btn-primary" href="company-dashboard.html">Company Panel</a>
            <a class="btn btn-ghost" href="admin-analytics.html">Analytics</a>
          </div>
        </div>

        <div class="panel">
          <h3>Company Info</h3>
          <p><strong>Email:</strong> ${htmlEscape(user.email)}</p>
          <p><strong>Phone:</strong> ${htmlEscape(user.phone)}</p>
          <p><strong>Username:</strong> ${htmlEscape(user.username)}</p>
        </div>

        <div class="panel">
          <h3>Recent Activity Stack</h3>
          ${renderActivities(stack)}
        </div>
      </section>
    `;
  }
}

// Internship cards
function renderInternCard(item, user, apps) {
  const already = user && user.role === "student" && apps.some(a => idEq(a.studentId, user.id) && idEq(a.internshipId, item.id));
  const saved = user && user.role === "student" && (user.saved || []).some(id => idEq(id, item.id));

  let action = `<a class="btn btn-primary btn-small" href="login.html">Login to Apply</a>`;

  if (user && user.role === "student") {
    action = `
      <button class="btn btn-ghost btn-small" onclick="toggleSave('${item.id}')">${saved ? "Saved ✓" : "Save"}</button>
      ${already ? `<span class="btn btn-ghost btn-small">Already Applied</span>` : `<a class="btn btn-primary btn-small" href="apply.html?id=${item.id}">Apply Now</a>`}
    `;
  }

  if (user && user.role === "company") {
    action = `<span class="btn btn-ghost btn-small">Company Account</span>`;
  }

  return `
    <article class="intern-card">
      <p class="company">${htmlEscape(item.companyName || COMPANY_NAME)}</p>
      <h3>${htmlEscape(item.title)}</h3>
      <div class="badges">
        <span class="badge">${htmlEscape(item.category)}</span>
        <span class="badge">${htmlEscape(item.mode)}</span>
        <span class="badge">${htmlEscape(item.location)}</span>
        <span class="badge">Rs ${htmlEscape(item.stipend)}</span>
        <span class="badge">Deadline: ${htmlEscape(item.deadline)}</span>
      </div>
      <p>${htmlEscape(item.description)}</p>
      <div class="badges">
        <span class="badge">Skills: ${htmlEscape(item.skills)}</span>
      </div>
      <div class="actions">${action}<a class="btn btn-ghost btn-small" href="compare.html">Compare</a></div>
    </article>
  `;
}

async function toggleSave(id) {
  if (!STATE.user || STATE.user.role !== "student") {
    alert("Student login required.");
    return;
  }

  try {
    const data = await APIService.post("data.php?action=toggle_save", { internship_id: id });
    STATE.user = data.user;
    alert("Saved list updated.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

function initInternshipsPage() {
  const list = $("internshipList");
  if (!list) return;

  const render = () => {
    let items = STATE.internships;
    items = SearchSorter.search(items, $("search").value, $("category").value);
    items = SearchSorter.sort(items, $("sort").value);
    const user = STATE.user;
    const apps = STATE.applications;

    list.innerHTML = items.length
      ? items.map(item => renderInternCard(item, user, apps)).join("")
      : `<div class="empty">No internship found.</div>`;
  };

  ["search", "category", "sort"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener(id === "search" ? "input" : "change", render);
  });

  render();
}

// Apply
function initApplyPage() {
  const form = $("applyForm");
  if (!form) return;

  const user = requireLogin();
  if (!user) return;

  if (user.role !== "student") {
    alert("Only students can apply.");
    location.href = "dashboard.html";
    return;
  }

  const id = new URLSearchParams(location.search).get("id");
  const internship = STATE.internships.find(item => idEq(item.id, id));

  if (!internship) {
    alert("Internship not found.");
    location.href = "internships.html";
    return;
  }

  $("applyTitle").textContent = internship.title;
  $("applyCompany").textContent = internship.companyName || COMPANY_NAME;
  $("applyMeta").innerHTML = `
    <span class="badge">${htmlEscape(internship.category)}</span>
    <span class="badge">${htmlEscape(internship.mode)}</span>
    <span class="badge">${htmlEscape(internship.location)}</span>
    <span class="badge">Rs ${htmlEscape(internship.stipend)}</span>
  `;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const resume = $("resume_url").value.trim();
    const cover = $("cover_letter").value.trim();
    let ok = true;

    if (!Validator.url(resume)) { showError("resumeError", "Enter a valid resume URL."); ok = false; } else clearError("resumeError");
    if (cover.length < 30) { showError("coverError", "Cover letter must be at least 30 characters."); ok = false; } else clearError("coverError");

    if (!ok) return;

    try {
      await APIService.post("data.php?action=apply", {
        internship_id: id,
        resume_url: resume,
        cover_letter: cover
      });
      alert("Application submitted and saved in MySQL database!");
      location.href = "my-applications.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

function initMyApplicationsPage() {
  const wrap = $("myApplications");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const applications = STATE.applications.filter(app => idEq(app.studentId, user.id));
  const internships = STATE.internships;

  if (!applications.length) {
    wrap.innerHTML = `<div class="empty">You have not applied yet.</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="panel table-card">
      <table>
        <thead>
          <tr><th>Internship</th><th>Company</th><th>Status</th><th>Interview</th><th>Feedback</th><th>Applied At</th></tr>
        </thead>
        <tbody>
          ${applications.map(app => {
            const item = internships.find(i => idEq(i.id, app.internshipId));
            return `
              <tr>
                <td>${htmlEscape(item ? item.title : "Deleted")}</td>
                <td>${htmlEscape(item ? item.companyName : "N/A")}</td>
                <td><strong class="status-${htmlEscape(app.status)}">${htmlEscape(app.status)}</strong></td>
                <td>${htmlEscape(app.interviewDate || "Not scheduled")}</td>
                <td>${htmlEscape(app.feedback || "No feedback yet")}</td>
                <td>${htmlEscape(app.appliedAt)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// Company dashboard
function initCompanyDashboardPage() {
  const form = $("postInternshipForm");
  if (!form) return;

  const user = requireLogin();
  if (!user) return;

  if (user.role !== "company") {
    alert("Only company can access this page.");
    location.href = "dashboard.html";
    return;
  }

  function render() {
    const internships = STATE.internships.filter(i => idEq(i.companyId, user.id));
    const received = STATE.applications.filter(app => internships.some(i => idEq(i.id, app.internshipId)));
    const queue = new ApplicationQueue(received);

    $("postedInternships").innerHTML = internships.length
      ? internships.map(i => renderInternCard(i, user, STATE.applications)).join("")
      : `<div class="empty">No internships posted yet.</div>`;

    if (queue.isEmpty()) {
      $("receivedApplications").innerHTML = `<div class="empty">No applications received yet.</div>`;
      return;
    }

    let html = "";

    while (!queue.isEmpty()) {
      const app = queue.dequeue();
      const internship = STATE.internships.find(i => idEq(i.id, app.internshipId));

      html += `
        <div class="panel" style="box-shadow:none;margin-bottom:16px">
          <h3>${htmlEscape(app.studentName)}</h3>
          <p><strong>Email:</strong> ${htmlEscape(app.studentEmail)}</p>
          <p><strong>Applied For:</strong> ${htmlEscape(internship ? internship.title : "N/A")}</p>
          <p><strong>Cover Letter:</strong> ${htmlEscape(app.coverLetter)}</p>
          <p><strong>Resume:</strong> <a style="color:var(--primary);font-weight:900" href="${htmlEscape(app.resumeUrl)}" target="_blank">Open Resume</a></p>
          <p><strong>Status:</strong> <span class="status-${htmlEscape(app.status)}">${htmlEscape(app.status)}</span></p>

          <div class="form-grid">
            <div class="input-group">
              <label>Status</label>
              <select id="status_${app.id}">
                ${["Pending","Shortlisted","Accepted","Rejected"].map(s => `<option value="${s}" ${app.status === s ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </div>
            <div class="input-group">
              <label>Interview Date</label>
              <input type="datetime-local" id="interview_${app.id}" value="${htmlEscape(app.interviewDate || "")}">
            </div>
            <div class="input-group full">
              <label>Feedback</label>
              <textarea id="feedback_${app.id}">${htmlEscape(app.feedback || "")}</textarea>
            </div>
          </div>

          <button onclick="updateApplication('${app.id}')">Update Application</button>
        </div>
      `;
    }

    $("receivedApplications").innerHTML = html;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      title: $("title").value.trim(),
      category: $("category").value,
      mode: $("mode").value,
      location: $("location").value.trim(),
      duration: $("duration").value.trim(),
      stipend: $("stipend").value,
      deadline: $("deadline").value,
      skills: $("skills").value.trim(),
      description: $("description").value.trim()
    };

    if (
      payload.title.length < 5 ||
      payload.location.length < 2 ||
      payload.duration.length < 2 ||
      Number(payload.stipend) < 0 ||
      !payload.deadline ||
      payload.skills.length < 3 ||
      payload.description.length < 20
    ) {
      alert("Please fill all fields correctly. Description minimum 20 characters.");
      return;
    }

    try {
      await APIService.post("data.php?action=post_internship", payload);
      await loadState();
      form.reset();
      render();
      alert("Internship posted and saved in MySQL database!");
    } catch (err) {
      alert(err.message);
    }
  });

  window.updateApplication = async id => {
    try {
      await APIService.post("data.php?action=update_application", {
        application_id: id,
        status: $("status_" + id).value,
        interview_date: $("interview_" + id).value,
        feedback: $("feedback_" + id).value.trim()
      });
      await loadState();
      render();
      alert("Application updated in MySQL database!");
    } catch (err) {
      alert(err.message);
    }
  };

  render();
}

function initSavedPage() {
  const wrap = $("savedWrap");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const savedItems = STATE.internships.filter(item => (user.saved || []).some(id => idEq(id, item.id)));

  wrap.innerHTML = savedItems.length
    ? `<section class="internships">${savedItems.map(i => renderInternCard(i, user, STATE.applications)).join("")}</section>`
    : `<div class="empty">No saved internships yet.</div>`;
}

function initProfilePage() {
  const form = $("profileForm");
  if (!form) return;

  const user = requireLogin();
  if (!user) return;

  $("fullName").value = user.fullName || "";
  $("phone").value = user.phone || "";
  $("education").value = user.education || "";
  $("skills").value = user.skills || "";

  form.addEventListener("submit", async e => {
    e.preventDefault();

    try {
      const data = await APIService.post("data.php?action=update_profile", {
        full_name: $("fullName").value.trim(),
        phone: $("phone").value.trim(),
        education: $("education").value.trim(),
        skills: $("skills").value.trim()
      });
      STATE.user = data.user;
      alert("Profile updated and saved in MySQL database!");
    } catch (err) {
      alert(err.message);
    }
  });
}

function initNotificationsPage() {
  const wrap = $("notificationsWrap");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const notifications = STATE.notifications;

  wrap.innerHTML = notifications.length
    ? notifications.map(n => `<div class="panel" style="margin-bottom:14px"><h3>Notification</h3><p>${htmlEscape(n.message)}</p><small>${htmlEscape(n.createdAt)}</small></div>`).join("")
    : `<div class="empty">No notifications yet.</div>`;
}

function initInterviewsPage() {
  const wrap = $("interviewsWrap");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const apps = STATE.applications;
  const internships = STATE.internships;

  let list = [];

  if (user.role === "student") {
    list = apps.filter(a => idEq(a.studentId, user.id) && a.interviewDate);
  } else {
    list = apps.filter(a => internships.some(i => idEq(i.companyId, user.id) && idEq(i.id, a.internshipId)) && a.interviewDate);
  }

  wrap.innerHTML = list.length
    ? list.map(a => {
        const i = internships.find(x => idEq(x.id, a.internshipId));
        return `<div class="panel" style="margin-bottom:14px"><h3>${htmlEscape(i ? i.title : "Internship Interview")}</h3><p><strong>Student:</strong> ${htmlEscape(a.studentName)}</p><p><strong>Date:</strong> ${htmlEscape(a.interviewDate)}</p><p><strong>Status:</strong> <span class="status-${htmlEscape(a.status)}">${htmlEscape(a.status)}</span></p></div>`;
      }).join("")
    : `<div class="empty">No interviews scheduled yet.</div>`;
}

function initCertificatePage() {
  const wrap = $("certificateWrap");
  if (!wrap) return;

  const user = requireLogin();
  if (!user) return;

  const accepted = STATE.applications.filter(a => idEq(a.studentId, user.id) && a.status === "Accepted");
  const internships = STATE.internships;

  wrap.innerHTML = accepted.length
    ? accepted.map(a => {
        const i = internships.find(x => idEq(x.id, a.internshipId));
        return `<div class="certificate"><span class="pill">Selection Certificate</span><h2>${htmlEscape(user.fullName)}</h2><p>has been selected for</p><h2>${htmlEscape(i ? i.title : "Internship")}</h2><p>at <strong>${htmlEscape(i ? i.companyName : COMPANY_NAME)}</strong></p><div class="actions no-print"><button onclick="print()">Print Certificate</button></div></div>`;
      }).join("<br>")
    : `<div class="empty">Certificate appears after company accepts your application.</div>`;
}

function initResumePage() {
  const form = $("resumeForm");
  if (!form) return;

  const user = requireLogin();
  if (!user) return;

  $("rName").value = user.fullName || "";
  $("rEmail").value = user.email || "";
  $("rPhone").value = user.phone || "";
  $("rSkills").value = user.skills || "";
  $("rEducation").value = user.education || "";

  function render() {
    $("resumePreview").innerHTML = `
      <div class="certificate" style="text-align:left">
        <h2>${htmlEscape($("rName").value)}</h2>
        <p><strong>Email:</strong> ${htmlEscape($("rEmail").value)} | <strong>Phone:</strong> ${htmlEscape($("rPhone").value)}</p>
        <h3>Education</h3><p>${htmlEscape($("rEducation").value)}</p>
        <h3>Skills</h3><p>${htmlEscape($("rSkills").value)}</p>
        <h3>Objective</h3><p>${htmlEscape($("rObjective").value || "Motivated student seeking internship opportunity at " + COMPANY_NAME + ".")}</p>
      </div>
    `;
  }

  form.addEventListener("input", render);
  render();
}

function initQuizPage() {
  const form = $("quizForm");
  if (!form) return;

  const user = requireLogin();
  if (!user) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    let score = 0;
    ["q1","q2","q3","q4","q5"].forEach(id => {
      const selected = document.querySelector(`input[name=${id}]:checked`);
      if (selected && selected.value === "1") score += 20;
    });

    $("quizResult").innerHTML = `<div class="panel"><h3>Your Skill Score: ${score}%</h3><div class="progress"><span style="width:${score}%"></span></div></div>`;

    try {
      await APIService.post("data.php?action=submit_quiz", { score });
    } catch (err) {
      alert(err.message);
    }
  });
}

function initComparePage() {
  const box = $("compareBox");
  if (!box) return;

  const internships = STATE.internships;
  const c1 = $("c1");
  const c2 = $("c2");

  if (!internships.length) {
    box.innerHTML = `<div class="empty">No internships available to compare.</div>`;
    return;
  }

  [c1, c2].forEach(select => {
    select.innerHTML = internships.map(i => `<option value="${i.id}">${htmlEscape(i.title)}</option>`).join("");
  });

  if (internships[1]) c2.value = internships[1].id;

  function render() {
    const a = internships.find(i => idEq(i.id, c1.value));
    const b = internships.find(i => idEq(i.id, c2.value));
    if (!a || !b) return;

    box.innerHTML = `
      <div class="panel table-card">
        <table>
          <tr><th>Field</th><th>${htmlEscape(a.title)}</th><th>${htmlEscape(b.title)}</th></tr>
          <tr><td>Company</td><td>${htmlEscape(a.companyName)}</td><td>${htmlEscape(b.companyName)}</td></tr>
          <tr><td>Category</td><td>${htmlEscape(a.category)}</td><td>${htmlEscape(b.category)}</td></tr>
          <tr><td>Mode</td><td>${htmlEscape(a.mode)}</td><td>${htmlEscape(b.mode)}</td></tr>
          <tr><td>Stipend</td><td>Rs ${htmlEscape(a.stipend)}</td><td>Rs ${htmlEscape(b.stipend)}</td></tr>
          <tr><td>Deadline</td><td>${htmlEscape(a.deadline)}</td><td>${htmlEscape(b.deadline)}</td></tr>
          <tr><td>Skills</td><td>${htmlEscape(a.skills)}</td><td>${htmlEscape(b.skills)}</td></tr>
        </table>
      </div>
    `;
  }

  c1.addEventListener("change", render);
  c2.addEventListener("change", render);
  render();
}

function initAnalyticsPage() {
  const wrap = $("analyticsWrap");
  if (!wrap) return;

  const users = STATE.stats.users || 0;
  const companies = STATE.stats.companies || 0;
  const internships = STATE.stats.internships || 0;
  const apps = STATE.stats.applications || 0;
  const accepted = STATE.stats.accepted || 0;
  const quizAvg = STATE.stats.quizAverage || 0;

  wrap.innerHTML = `
    <section class="stats">
      <div class="card stat"><strong>${users}</strong><span>Users</span></div>
      <div class="card stat"><strong>${internships}</strong><span>Internships</span></div>
      <div class="card stat"><strong>${apps}</strong><span>Applications</span></div>
      <div class="card stat"><strong>${accepted}</strong><span>Accepted</span></div>
    </section>

    <section class="grid-3">
      <div class="panel"><h3>Role Analytics</h3><p>Students: ${users - companies}</p><p>Companies: ${companies}</p></div>
      <div class="panel"><h3>Application Status</h3>${["Pending","Shortlisted","Accepted","Rejected"].map(s => `<p>${s}: ${STATE.stats.statusCounts?.[s] || 0}</p>`).join("")}</div>
      <div class="panel"><h3>Quiz Average</h3><p>${quizAvg}% average score</p></div>
    </section>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  updateNav();
  updateStatsOnHome();

  initRegisterPage();
  initLoginPage();
  initDashboardPage();
  initInternshipsPage();
  initApplyPage();
  initMyApplicationsPage();
  initCompanyDashboardPage();
  initSavedPage();
  initProfilePage();
  initNotificationsPage();
  initInterviewsPage();
  initCertificatePage();
  initResumePage();
  initQuizPage();
  initComparePage();
  initAnalyticsPage();
});
