// ===============================
// 🔒 PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

if (!token) {
  window.location.href = "login.html";
}

if (isAdmin !== "true") {
  window.location.href = "produtos.html";
}


// ===============================
// 📌 ELEMENTOS
// ===============================
const form = document.getElementById("notifyForm");
const textarea = document.getElementById("notifyMessage");
const statusText = document.getElementById("notifyStatus");
const button = form.querySelector("button");


// ===============================
// 📢 ENVIAR NOTIFICAÇÃO
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = textarea.value.trim();

  if (!message) {
    statusText.innerText = "Digite uma mensagem.";
    return;
  }

  button.disabled = true;
  button.innerText = "Enviando...";
  statusText.innerText = "";

  try {
    const response = await fetch(
      "https://catalogo-h0ro.onrender.com/api/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ message })
      }
    );

    const data = await response.json();

    if (response.ok) {
      statusText.innerText = "✅ Notificação enviada com sucesso!";
      textarea.value = "";
    } else {
      statusText.innerText = data.msg || "Erro ao enviar notificação.";
    }

  } catch (error) {
    statusText.innerText = "❌ Erro de conexão com servidor.";
  }

  button.disabled = false;
  button.innerText = "📢 Enviar Notificação";
});


// ===============================
// 🚫 BLOQUEIA VOLTAR
// ===============================
window.history.pushState(null, null, window.location.href);

window.onpopstate = function () {
  window.history.go(1);
};