// proteção
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

if (!token) window.location.href = "login.html";
if (isAdmin !== "true") window.location.href = "produtos.html";

const form = document.getElementById("userForm");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  // O select original tem id "isAdmin"
  const isAdminValue = document.getElementById("isAdmin").value === "true";

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