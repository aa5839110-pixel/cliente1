// VERIFICA LOGIN
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

// Se não estiver logado
if (!token) {
  window.location.href = "login.html";
}

// Se não for admin
if (isAdmin !== "true") {
  window.location.href = "produtos.html";
}


// Proteção extra ao voltar no navegador
window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
  window.history.go(1);
};