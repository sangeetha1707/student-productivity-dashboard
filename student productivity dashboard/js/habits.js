const uname = localStorage.getItem("loggedInUser");
if (!uname) window.location.href = "index.html";
document.getElementById("usernameDisplay").textContent = `Hi, ${uname} 🌸`;
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
};

const userKey = uname;
const todayLocalISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getUser = () => {
  const raw = localStorage.getItem(userKey);
  let u = raw ? JSON.parse(raw) : { password: "" };
  u.habits = u.habits || {};
  localStorage.setItem(userKey, JSON.stringify(u));
  return u;
};
const setUser = (u) => localStorage.setItem(userKey, JSON.stringify(u));

let user = getUser();
const todayKey = todayLocalISO();
document.getElementById("todayStr").textContent = `Today: ${todayKey}`;

const habitForm = document.getElementById("habitForm");
const habitName = document.getElementById("habitName");
const habitList = document.getElementById("habitList");
const habitTable = document.getElementById("habitTable");

habitForm.onsubmit = (e) => {
  e.preventDefault();
  const name = habitName.value.trim();
  if (!name) return;
  if (user.habits[name]) {
    alert("Habit already exists!");
    return;
  }
  user.habits[name] = { history: {}, lastDoneDate: null, streak: 0 };
  setUser(user);
  habitName.value = "";
  render();
};

const toggleToday = (name) => {
  const h = user.habits[name];
  h.history = h.history || {};
  const already = !!h.history[todayKey];
  if (already) {
    // uncheck today: reduce only if lastDoneDate is today
    delete h.history[todayKey];
    if (h.lastDoneDate === todayKey) {
      // recompute streak from history
      h.streak = recomputeStreak(h.history);
      h.lastDoneDate = latestDone(h.history);
    }
  } else {
    h.history[todayKey] = true;
    updateStreakOnCheck(h);
  }
  setUser(user);
  render();
};

const latestDone = (history) => {
  const keys = Object.keys(history || {}).sort();
  return keys.length ? keys[keys.length - 1] : null;
};

const dayDiff = (a, b) => {
  // a, b => 'YYYY-MM-DD'; returns difference in days (b - a)
  const pa = new Date(a + "T00:00:00");
  const pb = new Date(b + "T00:00:00");
  return Math.round((pb - pa) / (1000 * 60 * 60 * 24));
};

const updateStreakOnCheck = (h) => {
  if (!h.lastDoneDate) {
    h.lastDoneDate = todayKey;
    h.streak = 1;
    return;
  }
  const diff = dayDiff(h.lastDoneDate, todayKey);
  if (diff === 1) {
    h.streak = (h.streak || 0) + 1;
  } else if (diff >= 2) {
    h.streak = 1; // streak reset
  } // diff === 0 means toggling same day, handled earlier
  h.lastDoneDate = todayKey;
};

const recomputeStreak = (history) => {
  const keys = Object.keys(history || {}).sort();
  if (!keys.length) return 0;
  let streak = 1;
  for (let i = keys.length - 2; i >= 0; i--) {
    const diff = dayDiff(keys[i], keys[i + 1]);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

const deleteHabit = (name) => {
  if (!confirm(`Delete habit "${name}"?`)) return;
  delete user.habits[name];
  setUser(user);
  render();
};

const render = () => {
  // Today's checkboxes
  habitList.innerHTML = "";
  const names = Object.keys(user.habits);
  if (!names.length) {
    habitList.innerHTML = `<li class="empty">No habits yet. Add some! 🌱</li>`;
  } else {
    names.forEach(name => {
      const h = user.habits[name];
      const li = document.createElement("li");
      li.className = "list-item";
      const left = document.createElement("div");
      left.className = "row gap";
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!(h.history && h.history[todayKey]);
      chk.onchange = () => toggleToday(name);
      const span = document.createElement("span");
      span.textContent = name;
      left.appendChild(chk); left.appendChild(span);
      li.appendChild(left);
      habitList.appendChild(li);
    });
  }

  // Table
  habitTable.innerHTML = "";
  names.forEach(name => {
    const h = user.habits[name];
    const tr = document.createElement("tr");
    const tdName = document.createElement("td"); tdName.textContent = name;
    const tdStreak = document.createElement("td"); tdStreak.textContent = h.streak || 0;
    const tdLast = document.createElement("td"); tdLast.textContent = h.lastDoneDate || "-";
    const tdActions = document.createElement("td");
    const del = document.createElement("button"); del.className = "btn btn-danger"; del.textContent = "Delete";
    del.onclick = () => deleteHabit(name);
    tdActions.appendChild(del);
    tr.append(tdName, tdStreak, tdLast, tdActions);
    habitTable.appendChild(tr);
  });
};

render();
