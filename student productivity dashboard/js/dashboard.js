// ---------- helpers ----------
const uname = localStorage.getItem("loggedInUser");
if (!uname) window.location.href = "index.html";
const userKey = uname; // each user stored by username key

const todayLocalISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // local date, not UTC
};

const getUser = () => {
  const raw = localStorage.getItem(userKey);
  let u = raw ? JSON.parse(raw) : null;
  if (!u) {
    u = { password: "", todos: [], notes: [], habits: {} };
  }
  // init missing fields
  u.todos = u.todos || [];
  u.notes = u.notes || [];
  u.habits = u.habits || {};
  localStorage.setItem(userKey, JSON.stringify(u));
  return u;
};

const setUser = (u) => localStorage.setItem(userKey, JSON.stringify(u));

// ---------- header ----------
document.getElementById("usernameDisplay").textContent = `Hi, ${uname} 🌸`;
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
};

// ---------- load data ----------
let user = getUser();

// ---------- KPI: tasks ----------
const tasksDone = user.todos.filter(t => t.completed).length;
const tasksTotal = user.todos.length;
document.getElementById("tasksDone").textContent = tasksDone;
document.getElementById("tasksTotal").textContent = tasksTotal;
document.getElementById("tasksProgress").style.width = tasksTotal ? `${(tasksDone / tasksTotal) * 100}%` : "0%";

// ---------- KPI: notes ----------
document.getElementById("notesCount").textContent = user.notes.length;

// ---------- KPI: best streak ----------
const entries = Object.entries(user.habits);
let best = { name: "-", streak: 0 };
entries.forEach(([name, h]) => {
  const s = h.streak || 0;
  if (s > best.streak) best = { name, streak: s };
});
document.getElementById("bestStreak").textContent = best.streak;
document.getElementById("bestStreakName").textContent = best.name === "-" ? "Add some habits!" : best.name;

// ---------- Charts: last 7 days habit completions ----------
const lastNDates = (n) => {
  const arr = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
    arr.push({ label: `${dd}/${mm}`, key: `${yyyy}-${mm}-${dd}` });
  }
  return arr;
};
const last7 = lastNDates(7);

const habitCounts = last7.map(d => {
  let count = 0;
  for (const h of Object.values(user.habits)) {
    if (h.history && h.history[d.key]) count++;
  }
  return count;
});

new Chart(document.getElementById("habit7Chart").getContext("2d"), {
  type: "bar",
  data: {
    labels: last7.map(d => d.label),
    datasets: [{ label: "Completions", data: habitCounts }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, precision: 0 } } }
});

// ---------- Charts: last 7 days tasks completed ----------
const taskHistory = user.taskHistory || {}; // { 'YYYY-MM-DD': number }
const taskCounts = last7.map(d => taskHistory[d.key] || 0);
new Chart(document.getElementById("task7Chart").getContext("2d"), {
  type: "line",
  data: {
    labels: last7.map(d => d.label),
    datasets: [{ label: "Completed", data: taskCounts, tension: 0.3 }]
  },
  options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, precision: 0 } } }
});

// ---------- Quick Tasks ----------
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");

const renderTasks = () => {
  taskList.innerHTML = "";
  if (!user.todos.length) {
    taskList.innerHTML = `<li class="empty">No tasks yet 🌼</li>`;
    return;
  }
  user.todos.forEach((t, idx) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const left = document.createElement("div");
    left.className = "row gap";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!t.completed;
    const span = document.createElement("span");
    span.textContent = t.text;
    if (t.completed) span.classList.add("muted", "strike");

    chk.onchange = () => {
      const wasCompleted = !!user.todos[idx].completed;
      user.todos[idx].completed = chk.checked;
      // update taskHistory only when changing to completed
      if (!wasCompleted && chk.checked) {
        const k = todayLocalISO();
        user.taskHistory = user.taskHistory || {};
        user.taskHistory[k] = (user.taskHistory[k] || 0) + 1;
      }
      setUser(user);
      // update KPIs + charts quickly
      location.reload(); // keeps code small; feel free to optimize later
    };

    left.appendChild(chk);
    left.appendChild(span);

    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "✖";
    del.onclick = () => {
      user.todos.splice(idx, 1);
      setUser(user);
      location.reload();
    };

    li.appendChild(left);
    li.appendChild(del);
    taskList.appendChild(li);
  });
};

taskForm.onsubmit = (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  user.todos.push({ text, completed: false, createdAt: Date.now() });
  setUser(user);
  taskInput.value = "";
  location.reload();
};

renderTasks();

// ---------- Quick Notes ----------
const noteForm = document.getElementById("noteForm");
const noteInput = document.getElementById("noteInput");
const recentNotes = document.getElementById("recentNotes");

const renderRecentNotes = () => {
  recentNotes.innerHTML = "";
  if (!user.notes.length) {
    recentNotes.innerHTML = `<div class="empty">No notes yet. Your brain is suspiciously quiet 🧠✨</div>`;
    return;
  }
  const last3 = [...user.notes].slice(-3).reverse();
  last3.forEach(n => {
    const card = document.createElement("div");
    card.className = "note-chip";
    card.innerHTML = `<strong>${n.title || "Note"}</strong><p>${n.body.slice(0, 120)}${n.body.length>120?"…":""}</p>`;
    recentNotes.appendChild(card);
  });
};

noteForm.onsubmit = (e) => {
  e.preventDefault();
  const body = noteInput.value.trim();
  if (!body) return;
  user.notes.push({ id: crypto.randomUUID(), title: "", body, createdAt: Date.now() });
  setUser(user);
  noteInput.value = "";
  renderRecentNotes();
  document.getElementById("notesCount").textContent = user.notes.length;
};

renderRecentNotes();
