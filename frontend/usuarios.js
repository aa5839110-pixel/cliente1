// proteção
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

if (!token) window.location.href = "login.html";
if (isAdmin !== "true") window.location.href = "produtos.html";

const form = document.getElementById("userForm");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipoUsuario").value;
  let email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;

  // Para vendedor externo, força o email a conter "@vendedor" (opcional, mas recomendado)
  if (tipo === "vendedor" && !email.includes("@vendedor")) {
    // Se quiser forçar, pode acrescentar automaticamente ou pedir correção
    if (!confirm("Email de vendedor externo geralmente contém '@vendedor'. Deseja continuar assim mesmo?")) {
      return;
    }
  }

  // Define isAdmin de acordo com o tipo
  let isAdminValue = false;
  if (tipo === "admin") isAdminValue = true;

  const data = {
    name: name,
    email: email,
    password: password,
    isAdmin: isAdminValue
  };

  status.innerText = "Criando usuário...";

  try {
    const res = await fetch("https://catalogo-h0ro.onrender.com/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token
      },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (res.ok) {
      status.innerText = "✅ Usuário criado com sucesso!";
      form.reset();
    } else {
      status.innerText = json.msg || "Erro ao criar usuário";
    }

  } catch (err) {
    status.innerText = "Erro de conexão";
  }
});