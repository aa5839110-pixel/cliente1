// VERIFICA LOGIN
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

// se não estiver logado
if (!token) {
  window.location.href = "login.html";
}

// se não for admin
if (isAdmin !== "true") {
  window.location.href = "produtos.html";
}


// BOTÃO SAIR
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const confirmar = confirm("Deseja sair do sistema?");

    if (confirmar) {
      localStorage.clear();
      window.location.href = "login.html";
    }
  });
}