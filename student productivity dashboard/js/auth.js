// Handle Signup
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value;
    const password = document.getElementById("signupPassword").value;

    if (localStorage.getItem(username)) {
      document.getElementById("signupError").textContent = "Username already exists!";
    } else {
      localStorage.setItem(username, JSON.stringify({ password }));
      alert("Signup successful! Please login.");
      window.location.href = "index.html";
    }
  });
}

// Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const user = localStorage.getItem(username);
    if (user) {
      const parsedUser = JSON.parse(user);
      if (parsedUser.password === password) {
        localStorage.setItem("loggedInUser", username);
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("loginError").textContent = "Incorrect password!";
      }
    } else {
      document.getElementById("loginError").textContent = "User not found!";
    }
  });
}
