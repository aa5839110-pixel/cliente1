/* ======================================================
   MAIN.JS PROFISSIONAL - COMPLETO E ATUALIZADO
   Sistema Catálogo Teixeira
   com detecção de Vendedor Externo (e-mail específico)
   e Device ID persistente (localStorage + cookie)
====================================================== */

/* ======================================================
   CONFIG
====================================================== */
const API_BASE = "https://cliente1-jucivan.onrender.com";
const COOKIE_AGE = 365; // dias

/* ======================================================
   HELPERS
====================================================== */
function $(id) {
  return document.getElementById(id);
}

function getToken() {
  return localStorage.getItem("token");
}

function isAdmin() {
  return localStorage.getItem("isAdmin") === "true";
}

function logout() {
  // ✅ CORRETO: remove apenas as chaves de sessão
  localStorage.removeItem("token");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("isVendedorExterno");
  // deviceId NÃO é removido

  window.location.href = "login.html";
}

function money(v) {
  return Number(v || 0).toFixed(2).replace(".", ",");
}

function safeJson(res) {
  return res.text().then(txt => {
    try {
      return JSON.parse(txt);
    } catch {
      return { msg: txt };
    }
  });
}

/* ======================================================
   DEVICE ID PERSISTENTE (localStorage + cookie)
====================================================== */
function getDeviceId() {
  // 1. Tenta ler do localStorage
  let id = localStorage.getItem("deviceId");

  // 2. Se não existir, tenta ler do cookie
  if (!id) {
    const match = document.cookie.match(/deviceId=([^;]+)/);
    if (match) {
      id = match[1];
      localStorage.setItem("deviceId", id);
      console.log("📱 Device ID recuperado do cookie:", id);
    }
  }

  // 3. Se ainda não existe, gera um novo
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
    document.cookie = `deviceId=${id}; path=/; max-age=${COOKIE_AGE * 86400}`;
    console.log("📱 Novo device ID gerado:", id);
  } else {
    // Garante que o cookie também tenha o ID
    const cookieMatch = document.cookie.match(/deviceId=([^;]+)/);
    if (!cookieMatch) {
      document.cookie = `deviceId=${id}; path=/; max-age=${COOKIE_AGE * 86400}`;
    }
  }

  return id;
}

// Gera/obtém o ID e expõe globalmente
const DEVICE_ID = getDeviceId();
console.log("✅ Device ID atual:", DEVICE_ID);

// Sincroniza localStorage e cookie a cada 5 segundos (opcional)
setInterval(() => {
  const localId = localStorage.getItem("deviceId");
  const cookieId = document.cookie.match(/deviceId=([^;]+)/)?.[1];
  if (localId && cookieId && localId !== cookieId) {
    localStorage.setItem("deviceId", cookieId);
    console.log("🔄 Device ID sincronizado com o cookie.");
  }
}, 5000);

/* ======================================================
   PROTEÇÃO DE ROTAS
====================================================== */
(function protectPages() {
  const page = window.location.pathname;

  const privatePages = [
    "produtos.html",
    "promocoe.html",
    "admin.html",
    "painel.html"
  ];

  if (privatePages.some(p => page.includes(p))) {
    if (!getToken()) {
      window.location.href = "login.html";
      return;
    }
  }

  if (page.includes("painel.html")) {
    if (!isAdmin()) {
      alert("Apenas administradores.");
      window.location.href = "produtos.html";
    }
  }
})();

/* ======================================================
   LOGIN (COM DETECÇÃO DE VENDEDOR EXTERNO POR E-MAIL)
====================================================== */
const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();

    const btn = loginForm.querySelector("button");
    const msg = $("msg");

    btn.disabled = true;
    btn.innerText = "Entrando...";

    const email = $("email").value.trim();
    const password = $("password").value.trim();
    const deviceId = DEVICE_ID; // usa o ID persistente

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          deviceId
        })
      });

      const data = await safeJson(res);

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", data.user.isAdmin);

        // 🔥 DETECTA VENDEDOR EXTERNO PELO E-MAIL FIXO
        const isVendedorExterno = (email === "vendedor@gmail.com");
        if (isVendedorExterno) {
          localStorage.setItem("isVendedorExterno", "true");
          console.log("✅ Vendedor externo detectado. Flag salva.");
        } else {
          localStorage.removeItem("isVendedorExterno");
          console.log("❌ Usuário comum. Flag removida.");
        }

        // Redireciona
        window.location.href = data.user.isAdmin ? "painel.html" : "produtos.html";

      } else {
        msg.innerText = data.msg || "Erro no login";
      }

    } catch (err) {
      console.error(err);
      msg.innerText = "Erro de conexão.";
    }

    btn.disabled = false;
    btn.innerText = "Entrar";
  });
}

/* ======================================================
   LOGOUT GLOBAL
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const btn = $("logout");

  if (btn) {
    btn.addEventListener("click", e => {
      e.preventDefault();
      logout();
    });
  }
});

/* ======================================================
   NOTIFICAÇÕES
====================================================== */
async function loadNotifications() {
  const box = $("notificacoes");
  if (!box) return;

  try {
    const res = await fetch(`${API_BASE}/api/notifications`);
    const data = await safeJson(res);

    if (!Array.isArray(data) || !data.length) {
      box.style.display = "none";
      return;
    }

    box.innerHTML = data.map(n =>
      `<div class="notificacao-item">📢 ${n.message}</div>`
    ).join("");

  } catch (err) {
    console.log(err);
  }
}

loadNotifications();

/* ======================================================
   ADMIN - CADASTRAR PRODUTO
====================================================== */
const productForm = $("productForm");

if (productForm) {

  const imageInput = $("image");
  const preview = $("imagePreview");

  if (imageInput) {
    imageInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file || !preview) return;

      const reader = new FileReader();

      reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = "block";
      };

      reader.readAsDataURL(file);
    });
  }

  productForm.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(productForm);

    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: {
          "x-auth-token": getToken()
        },
        body: formData
      });

      const data = await safeJson(res);

      if (res.ok) {
        alert("✅ Produto cadastrado!");
        productForm.reset();

        if (preview) preview.style.display = "none";

      } else {
        alert(data.msg || "Erro ao cadastrar.");
      }

    } catch (err) {
      console.log(err);
      alert("Erro de conexão.");
    }
  });
}

/* ======================================================
   PROMOÇÕES
====================================================== */
const promoForm = $("promoForm");

if (promoForm) {

  promoForm.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(promoForm);

    try {
      const res = await fetch(`${API_BASE}/api/promos`, {
        method: "POST",
        headers: {
          "x-auth-token": getToken()
        },
        body: formData
      });

      const data = await safeJson(res);

      if (res.ok) {
        alert("✅ Promoção cadastrada!");
        promoForm.reset();
      } else {
        alert(data.msg || "Erro.");
      }

    } catch {
      alert("Erro de conexão.");
    }
  });
}

/* ======================================================
   EXCLUIR PRODUTO
====================================================== */
async function deleteProduct(id) {

  if (!confirm("Deseja excluir produto?")) return;

  try {

    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": getToken()
      }
    });

    const data = await safeJson(res);

    alert(data.msg);

    location.reload();

  } catch {
    alert("Erro ao excluir.");
  }
}

/* ======================================================
   ENVIAR NOTIFICAÇÃO
====================================================== */
const notifyForm = $("notifyForm");

if (notifyForm) {

  notifyForm.addEventListener("submit", async e => {
    e.preventDefault();

    const text = $("notifyMessage").value.trim();

    if (!text) return;

    try {

      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken()
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await safeJson(res);

      alert(data.msg || "Enviado.");

      notifyForm.reset();

    } catch {
      alert("Erro.");
    }
  });
}

/* ======================================================
   NAVEGAÇÃO DE SEÇÕES
====================================================== */
function showSection(id) {

  document.querySelectorAll(".section")
    .forEach(sec => sec.classList.remove("active"));

  const el = document.getElementById(id);

  if (el) el.classList.add("active");
}

/* ======================================================
   UPDATE JSON (opcional - ative se necessário)
====================================================== */
/*
document.addEventListener("DOMContentLoaded", () => {
  const btn = $("uploadJsonBtn");
  const fileInput = $("jsonFile");
  const status = $("jsonStatus");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!fileInput.files.length) {
      alert("Selecione arquivo JSON.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const json = JSON.parse(e.target.result);
        status.innerText = "⏳ Atualizando...";
        const res = await fetch(`${API_BASE}/api/products/update-json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": getToken()
          },
          body: JSON.stringify(json)
        });
        const data = await safeJson(res);
        status.innerText = data.msg;
        alert(data.msg);
      } catch (err) {
        status.innerText = "Erro no arquivo.";
      }
    };
    reader.readAsText(file);
  });
});
*/