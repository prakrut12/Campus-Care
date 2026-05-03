const STORAGE_KEY = "campuscare_state_v1";

const statusLabels = ["Open", "In Progress", "Resolved", "Closed"];

const defaultState = {
  currentUserId: null,
  categories: [
    { id: "cat-hostel", name: "Hostel" },
    { id: "cat-library", name: "Library" },
    { id: "cat-it", name: "IT Support" },
    { id: "cat-accounts", name: "Accounts" },
    { id: "cat-academics", name: "Academics" }
  ],
  users: [
    { id: "u-admin", name: "Campus Admin", email: "admin@campuscare.edu", password: "admin123", role: "admin" },
    { id: "u-riya", name: "Riya Sharma", email: "riya@campuscare.edu", password: "student123", role: "student" }
  ],
  tickets: [
    {
      id: "t-1001",
      title: "Wi-Fi not working in Block B",
      description: "The connection drops repeatedly in the second floor study area.",
      categoryId: "cat-it",
      status: "Open",
      priority: "High",
      studentId: "u-riya",
      createdAt: "2026-05-01T10:30:00.000Z",
      updatedAt: "2026-05-01T10:30:00.000Z"
    },
    {
      id: "t-1002",
      title: "Library book renewal issue",
      description: "The online portal is not allowing renewal for a book that is not reserved.",
      categoryId: "cat-library",
      status: "In Progress",
      priority: "Medium",
      studentId: "u-riya",
      createdAt: "2026-05-02T07:50:00.000Z",
      updatedAt: "2026-05-02T11:20:00.000Z"
    }
  ],
  comments: [
    {
      id: "c-1",
      ticketId: "t-1002",
      userId: "u-admin",
      text: "Library desk has been notified. Please try again after the catalogue sync.",
      status: "In Progress",
      createdAt: "2026-05-02T11:20:00.000Z"
    }
  ]
};

let state = loadState();
let route = "login";

const view = document.getElementById("view");
const nav = document.getElementById("nav");
const pageTitle = document.getElementById("pageTitle");
const pageEyebrow = document.getElementById("pageEyebrow");
const sidebarUser = document.getElementById("sidebarUser");
const sidebarRole = document.getElementById("sidebarRole");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");
const sidebar = document.getElementById("sidebar");

document.getElementById("menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

logoutBtn.addEventListener("click", () => {
  state.currentUserId = null;
  saveState();
  route = "login";
  showToast("Logged out successfully.");
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }
  return JSON.parse(saved);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function currentUser() {
  return state.users.find(user => user.id === state.currentUserId) || null;
}

function getCategoryName(categoryId) {
  return state.categories.find(category => category.id === categoryId)?.name || "Unknown";
}

function getUserName(userId) {
  return state.users.find(user => user.id === userId)?.name || "Unknown";
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateText));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 2600);
}

function navigate(nextRoute) {
  route = nextRoute;
  sidebar.classList.remove("open");
  render();
}

function render() {
  const user = currentUser();
  logoutBtn.classList.toggle("hidden", !user);
  sidebarUser.textContent = user ? user.name : "Guest";
  sidebarRole.textContent = user ? user.role.toUpperCase() : "Please login";
  renderNav(user);

  if (!user) {
    route = route === "register" ? "register" : "login";
    renderAuth(route);
    return;
  }

  if (user.role === "admin" && ["studentDashboard", "raiseTicket", "myTickets"].includes(route)) {
    route = "adminDashboard";
  }
  if (user.role === "student" && ["adminDashboard", "manageTickets", "analytics"].includes(route)) {
    route = "studentDashboard";
  }

  const routes = {
    studentDashboard: renderStudentDashboard,
    raiseTicket: renderRaiseTicket,
    myTickets: renderMyTickets,
    adminDashboard: renderAdminDashboard,
    manageTickets: renderManageTickets,
    analytics: renderAnalytics
  };

  const defaultRoute = user.role === "admin" ? "adminDashboard" : "studentDashboard";
  (routes[route] || routes[defaultRoute])();
}

function renderNav(user) {
  const items = !user
    ? [
        ["login", "Login"],
        ["register", "Register"]
      ]
    : user.role === "admin"
      ? [
          ["adminDashboard", "Admin dashboard"],
          ["manageTickets", "Manage tickets"],
          ["analytics", "Analytics"]
        ]
      : [
          ["studentDashboard", "Student dashboard"],
          ["raiseTicket", "Raise ticket"],
          ["myTickets", "My tickets"]
        ];

  nav.innerHTML = items.map(([key, label]) => (
    `<button class="${route === key ? "active" : ""}" data-route="${key}">${label}</button>`
  )).join("");

  nav.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
}

function setHeader(title, eyebrow) {
  pageTitle.textContent = title;
  pageEyebrow.textContent = eyebrow;
}

function renderAuth(tab) {
  setHeader(tab === "register" ? "Create your account" : "Login to CampusCare", "Authentication");
  view.innerHTML = document.getElementById("authTemplate").innerHTML;

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = view.querySelectorAll("[data-auth-tab]");

  tabs.forEach(button => {
    button.classList.toggle("active", button.dataset.authTab === tab);
    button.addEventListener("click", () => {
      route = button.dataset.authTab;
      renderAuth(route);
      renderNav(null);
    });
  });

  loginForm.classList.toggle("hidden", tab !== "login");
  registerForm.classList.toggle("hidden", tab !== "register");

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const email = form.get("email").trim().toLowerCase();
    const password = form.get("password");
    const user = state.users.find(item => item.email === email && item.password === password);
    if (!user) {
      showToast("Invalid email or password.");
      return;
    }
    state.currentUserId = user.id;
    saveState();
    route = user.role === "admin" ? "adminDashboard" : "studentDashboard";
    showToast(`Welcome back, ${user.name}.`);
    render();
  });

  registerForm.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(registerForm);
    const email = form.get("email").trim().toLowerCase();
    if (state.users.some(user => user.email === email)) {
      showToast("An account already exists for this email.");
      return;
    }
    const user = {
      id: uid("u"),
      name: form.get("name").trim(),
      email,
      password: form.get("password"),
      role: form.get("role")
    };
    state.users.push(user);
    state.currentUserId = user.id;
    saveState();
    route = user.role === "admin" ? "adminDashboard" : "studentDashboard";
    showToast("Account created successfully.");
    render();
  });
}

function scopedTickets() {
  const user = currentUser();
  if (!user) return [];
  return user.role === "admin" ? state.tickets : state.tickets.filter(ticket => ticket.studentId === user.id);
}

function counts(tickets = scopedTickets()) {
  return {
    total: tickets.length,
    open: tickets.filter(ticket => ticket.status === "Open").length,
    progress: tickets.filter(ticket => ticket.status === "In Progress").length,
    resolved: tickets.filter(ticket => ticket.status === "Resolved").length,
    closed: tickets.filter(ticket => ticket.status === "Closed").length
  };
}

function metricGrid(ticketList = scopedTickets()) {
  const data = counts(ticketList);
  return `
    <div class="grid four">
      <article class="metric"><span>Total tickets</span><strong>${data.total}</strong></article>
      <article class="metric"><span>Open</span><strong>${data.open}</strong></article>
      <article class="metric"><span>In progress</span><strong>${data.progress}</strong></article>
      <article class="metric"><span>Resolved</span><strong>${data.resolved + data.closed}</strong></article>
    </div>
  `;
}

function renderStudentDashboard() {
  setHeader("Student dashboard", "Your support overview");
  const tickets = scopedTickets();
  view.innerHTML = `
    <div class="grid">
      ${metricGrid(tickets)}
      <section class="panel">
        <div class="section-head">
          <h2>Recent tickets</h2>
          <button class="primary" id="quickRaise">Raise ticket</button>
        </div>
        ${ticketList(tickets.slice().sort(sortNewest).slice(0, 4), false)}
      </section>
    </div>
  `;
  document.getElementById("quickRaise").addEventListener("click", () => navigate("raiseTicket"));
}

function renderRaiseTicket() {
  setHeader("Raise ticket", "Tell the helpdesk what needs attention");
  view.innerHTML = `
    <section class="panel">
      <form id="ticketForm" class="form">
        <div class="grid two">
          <label>Ticket title<input name="title" required placeholder="Example: Lab printer not working"></label>
          <label>Category
            <select name="categoryId" required>
              ${state.categories.map(category => `<option value="${category.id}">${category.name}</option>`).join("")}
            </select>
          </label>
        </div>
        <label>Priority
          <select name="priority">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </label>
        <label>Description<textarea name="description" required placeholder="Describe the problem, location, and any useful details"></textarea></label>
        <button class="primary" type="submit">Submit ticket</button>
      </form>
    </section>
  `;

  document.getElementById("ticketForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    state.tickets.push({
      id: uid("t"),
      title: form.get("title").trim(),
      description: form.get("description").trim(),
      categoryId: form.get("categoryId"),
      priority: form.get("priority"),
      status: "Open",
      studentId: currentUser().id,
      createdAt: now,
      updatedAt: now
    });
    saveState();
    showToast("Ticket submitted.");
    navigate("myTickets");
  });
}

function renderMyTickets() {
  setHeader("My tickets", "Track your requests");
  view.innerHTML = ticketBrowser(scopedTickets(), false);
  wireFilters(false);
}

function renderAdminDashboard() {
  setHeader("Admin dashboard", "Campus helpdesk command center");
  const latest = state.tickets.slice().sort(sortNewest).slice(0, 5);
  view.innerHTML = `
    <div class="grid">
      ${metricGrid(state.tickets)}
      <div class="grid two">
        <section class="panel">
          <div class="section-head">
            <h2>Ticket load by category</h2>
          </div>
          ${categoryBars()}
        </section>
        <section class="panel">
          <div class="section-head">
            <h2>Latest activity</h2>
            <button class="secondary" id="manageNow">Manage</button>
          </div>
          ${ticketList(latest, false)}
        </section>
      </div>
    </div>
  `;
  document.getElementById("manageNow").addEventListener("click", () => navigate("manageTickets"));
}

function renderManageTickets() {
  setHeader("Manage tickets", "Update status and respond");
  view.innerHTML = ticketBrowser(state.tickets, true);
  wireFilters(true);
}

function renderAnalytics() {
  setHeader("Analytics", "Ticket patterns and resolution mix");
  const data = counts(state.tickets);
  const total = Math.max(data.total, 1);
  const openAngle = data.open / total * 360;
  const progressAngle = openAngle + data.progress / total * 360;
  const resolvedAngle = progressAngle + data.resolved / total * 360;

  view.innerHTML = `
    <div class="grid">
      ${metricGrid(state.tickets)}
      <div class="chart-grid">
        <section class="chart-panel">
          <div class="section-head"><h2>Status chart</h2></div>
          <div class="donut" style="--open:${openAngle}deg; --progress:${progressAngle}deg; --resolved:${resolvedAngle}deg;"></div>
          <div class="legend">
            <span><i class="dot" style="background:var(--red)"></i>Open</span>
            <span><i class="dot" style="background:var(--amber)"></i>In progress</span>
            <span><i class="dot" style="background:var(--green)"></i>Resolved</span>
            <span><i class="dot" style="background:#98a2b3"></i>Closed</span>
          </div>
        </section>
        <section class="chart-panel">
          <div class="section-head"><h2>Category chart</h2></div>
          ${categoryBars()}
        </section>
      </div>
    </div>
  `;
}

function ticketBrowser(tickets, editable) {
  return `
    <section class="panel">
      <div class="filters">
        <label>Status
          <select id="statusFilter">
            <option value="">All statuses</option>
            ${statusLabels.map(status => `<option>${status}</option>`).join("")}
          </select>
        </label>
        <label>Category
          <select id="categoryFilter">
            <option value="">All categories</option>
            ${state.categories.map(category => `<option value="${category.id}">${category.name}</option>`).join("")}
          </select>
        </label>
        <label>Search
          <input id="searchFilter" placeholder="Search title or student">
        </label>
      </div>
      <div id="ticketResults">${ticketList(tickets, editable)}</div>
    </section>
  `;
}

function wireFilters(editable) {
  const statusFilter = document.getElementById("statusFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const searchFilter = document.getElementById("searchFilter");
  const results = document.getElementById("ticketResults");

  function update() {
    const query = searchFilter.value.trim().toLowerCase();
    const filtered = scopedTickets().filter(ticket => {
      const matchesStatus = !statusFilter.value || ticket.status === statusFilter.value;
      const matchesCategory = !categoryFilter.value || ticket.categoryId === categoryFilter.value;
      const haystack = `${ticket.title} ${ticket.description} ${getUserName(ticket.studentId)}`.toLowerCase();
      return matchesStatus && matchesCategory && haystack.includes(query);
    });
    results.innerHTML = ticketList(filtered, editable);
    if (editable) wireTicketActions();
  }

  [statusFilter, categoryFilter, searchFilter].forEach(input => {
    input.addEventListener("input", update);
  });
  if (editable) wireTicketActions();
}

function ticketList(tickets, editable) {
  if (!tickets.length) {
    return `<div class="empty">No tickets found.</div>`;
  }
  return `
    <div class="tickets">
      ${tickets.slice().sort(sortNewest).map(ticket => ticketCard(ticket, editable)).join("")}
    </div>
  `;
}

function ticketCard(ticket, editable) {
  const comments = state.comments
    .filter(comment => comment.ticketId === ticket.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    <article class="ticket-card">
      <div class="ticket-top">
        <div>
          <h3>${escapeHtml(ticket.title)}</h3>
          <div class="ticket-meta">
            <span class="badge ${statusClass(ticket.status)}">${ticket.status}</span>
            <span class="badge">${getCategoryName(ticket.categoryId)}</span>
            <span class="badge">${ticket.priority}</span>
            <span class="badge">${getUserName(ticket.studentId)}</span>
          </div>
        </div>
        <small>${formatDate(ticket.createdAt)}</small>
      </div>
      <p class="ticket-description">${escapeHtml(ticket.description)}</p>
      ${editable ? adminActions(ticket) : ""}
      ${comments.length ? `
        <div class="timeline">
          ${comments.map(comment => `
            <p><strong>${comment.status}</strong> by ${getUserName(comment.userId)}: ${escapeHtml(comment.text)} <small>${formatDate(comment.createdAt)}</small></p>
          `).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function adminActions(ticket) {
  return `
    <div class="ticket-actions" data-ticket-id="${ticket.id}">
      <label>Status
        <select class="statusSelect">
          ${statusLabels.map(status => `<option ${ticket.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <label>Comment / status update
        <input class="commentInput" placeholder="Add a short update for the student">
      </label>
      <button class="primary saveStatus" type="button">Update</button>
    </div>
  `;
}

function wireTicketActions() {
  document.querySelectorAll(".ticket-actions").forEach(action => {
    action.querySelector(".saveStatus").addEventListener("click", () => {
      const ticket = state.tickets.find(item => item.id === action.dataset.ticketId);
      const status = action.querySelector(".statusSelect").value;
      const text = action.querySelector(".commentInput").value.trim() || `Status changed to ${status}.`;
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();
      state.comments.push({
        id: uid("c"),
        ticketId: ticket.id,
        userId: currentUser().id,
        text,
        status,
        createdAt: new Date().toISOString()
      });
      saveState();
      showToast("Ticket updated.");
      renderManageTickets();
    });
  });
}

function categoryBars() {
  const max = Math.max(1, ...state.categories.map(category => (
    state.tickets.filter(ticket => ticket.categoryId === category.id).length
  )));
  return `
    <div class="bars">
      ${state.categories.map(category => {
        const count = state.tickets.filter(ticket => ticket.categoryId === category.id).length;
        return `
          <div class="bar-row">
            <strong>${category.name}</strong>
            <span class="bar-track"><span class="bar" style="width:${count / max * 100}%"></span></span>
            <b>${count}</b>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function sortNewest(a, b) {
  return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
}

function statusClass(status) {
  return {
    "Open": "open",
    "In Progress": "progress",
    "Resolved": "resolved",
    "Closed": "closed"
  }[status] || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();