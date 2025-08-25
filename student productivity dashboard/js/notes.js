const uname = localStorage.getItem("loggedInUser");
if (!uname) window.location.href = "index.html";
document.getElementById("usernameDisplay").textContent = `Hi, ${uname} 🌸`;
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
};

const userKey = uname;
const getUser = () => {
  const raw = localStorage.getItem(userKey);
  const u = raw ? JSON.parse(raw) : { password: "", notes: [] };
  u.notes = u.notes || [];
  localStorage.setItem(userKey, JSON.stringify(u));
  return u;
};
const setUser = (u) => localStorage.setItem(userKey, JSON.stringify(u));

let user = getUser();

const noteForm = document.getElementById("noteForm");
const titleInput = document.getElementById("noteTitle");
const bodyInput = document.getElementById("noteBody");
const notesGrid = document.getElementById("notesGrid");
const noteSearch = document.getElementById("noteSearch");

const render = (filter = "") => {
  notesGrid.innerHTML = "";
  const items = user.notes
    .filter(n => (n.title + " " + n.body).toLowerCase().includes(filter.toLowerCase()))
    .slice()
    .reverse();

  if (!items.length) {
    notesGrid.innerHTML = `<div class="empty">Nothing to see here... yet 👀</div>`;
    return;
  }

  items.forEach(n => {
    const card = document.createElement("div");
    card.className = "note-card";
    const title = document.createElement("h4");
    title.textContent = n.title || "Untitled";
    const body = document.createElement("p");
    body.textContent = n.body;
    const row = document.createElement("div");
    row.className = "row right gap";
    const del = document.createElement("button");
    del.className = "btn btn-danger";
    del.textContent = "Delete";
    del.onclick = () => {
      user.notes = user.notes.filter(x => x.id !== n.id);
      setUser(user);
      render(noteSearch.value);
    };
    row.appendChild(del);

    card.append(title, body, row);
    notesGrid.appendChild(card);
  });
};

noteForm.onsubmit = (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title && !body) return;
  user.notes.push({ id: crypto.randomUUID(), title, body, createdAt: Date.now() });
  setUser(user);
  titleInput.value = ""; bodyInput.value = "";
  render(noteSearch.value);
};

noteSearch.oninput = () => render(noteSearch.value);

render();
