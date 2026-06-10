// ===============================
// 🔒 PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
const adminStatus = localStorage.getItem("isAdmin");

if (!token) {
  window.location.href = "login.html";
}

if (adminStatus !== "true") {
  window.location.href = "produtos.html";
}

// ===============================
// 🌐 API
// ===============================
const API = "https://catalogo-h0ro.onrender.com/api/products";

// ===============================
// 📑 TROCA DE ABAS
// ===============================
const tabs = document.querySelectorAll(".tab");
const boxes = document.querySelectorAll(".box");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(btn => btn.classList.remove("active"));
    boxes.forEach(box => box.classList.remove("active"));
    tab.classList.add("active");
    const alvo = tab.getAttribute("data-tab");
    const destino = document.getElementById(alvo);
    if (destino) destino.classList.add("active");
  });
});

// ===============================
// ⛔ BLOQUEAR VOLTAR
// ===============================
window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
  window.history.go(1);
};

// ===============================
// 📦 ELEMENTOS
// ===============================
const formProduto = document.getElementById("productForm");
const formPromo = document.getElementById("promoForm");

// ===============================
// 📤 CADASTRAR PRODUTO (COM MÚLTIPLAS IMAGENS)
// ===============================
if (formProduto) {
  formProduto.addEventListener("submit", async function (e) {
    e.preventDefault();

    const btnSubmit = formProduto.querySelector('button[type="submit"]');
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      alert("❌ Você não está autenticado!\nFaça login novamente.");
      window.location.href = "login.html";
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Cadastrando...";

    try {
      const productId = document.getElementById("productId").value.trim();
      const name = document.getElementById("name").value.trim();
      const description = document.getElementById("description").value.trim() || "";
      const price1 = document.getElementById("price1").value;
      const price2 = document.getElementById("price2").value;
      const stock = document.getElementById("stock").value;
      const category = document.getElementById("category").value.trim();
      
      // 🔥 ALTERAÇÃO AQUI: pegar o input com id="images" (multiple)
      const imageFiles = document.getElementById("images").files;

      // Validações
      if (!productId || !name || !category) {
        alert("❌ Preencha ID, Nome e Categoria!");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "💾 Adicionar Produto";
        return;
      }

      if (!price1 || !price2 || !stock) {
        alert("❌ Preencha os preços e estoque!");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "💾 Adicionar Produto";
        return;
      }

      if (imageFiles.length === 0) {
        alert("❌ Selecione pelo menos uma imagem!");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "💾 Adicionar Produto";
        return;
      }

      // Criar FormData
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price1", price1);
      formData.append("price2", price2);
      formData.append("stock", stock);
      formData.append("stockL1", stock);
      formData.append("stockL5", "0");
      formData.append("category", category);
      formData.append("isPromo", "false");

      // 🔥 Enviar de 1 até 6 imagens
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append("images", imageFiles[i]);
      }

      // Debug
      let dadosDebug = "📦 DADOS ENVIADOS:\n\n";
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          dadosDebug += `${key}: [ARQUIVO] ${value.name} (${(value.size/1024).toFixed(1)}KB)\n`;
        } else {
          dadosDebug += `${key}: ${value}\n`;
        }
      }
      console.log(dadosDebug);

      // ENVIAR PARA API
      const res = await fetch(API, {
        method: "POST",
        headers: { "x-auth-token": currentToken },
        body: formData
      });

      console.log("📡 STATUS:", res.status);

      const responseText = await res.text();
      console.log("📄 RESPOSTA BRUTA:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("❌ Resposta não é JSON:", responseText);
        alert("❌ Erro interno do servidor!\n\nResposta: " + responseText.substring(0, 200));
        btnSubmit.disabled = false;
        btnSubmit.innerText = "💾 Adicionar Produto";
        return;
      }

      if (res.ok) {
        alert("✅ " + (data.msg || "Produto cadastrado com sucesso!"));
        console.log("✅ PRODUTO CRIADO:", data);
        formProduto.reset();
        // Limpar preview de imagens, se houver
        const fileInput = document.getElementById("images");
        if (fileInput) fileInput.value = "";
      } else if (res.status === 401) {
        alert("❌ Sessão expirada!\nFaça login novamente.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
      } else {
        const mensagemErro = data.msg || data.message || data.error || "Erro desconhecido";
        alert("❌ " + mensagemErro);
        console.error("❌ ERRO COMPLETO:", data);
      }

    } catch (error) {
      console.error("🔥 ERRO DE REDE:", error);
      alert("❌ Erro de conexão!\n" + error.message);
    }

    btnSubmit.disabled = false;
    btnSubmit.innerText = "💾 Adicionar Produto";
  });
}

// ===============================
// 🔥 CADASTRAR PROMOÇÃO (também com múltiplas imagens)
// ===============================
if (formPromo) {
  formPromo.addEventListener("submit", async function (e) {
    e.preventDefault();

    const btnSubmit = formPromo.querySelector('button[type="submit"]');
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      alert("❌ Sessão expirada!");
      window.location.href = "login.html";
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Cadastrando...";

    try {
      const formData = new FormData(formPromo);
      formData.append("isPromo", "true");

      // Se houver campo de imagens na promoção, também adaptar
      const promoImages = document.getElementById("promoImages")?.files;
      if (promoImages && promoImages.length > 0) {
        for (let i = 0; i < promoImages.length; i++) {
          formData.append("images", promoImages[i]);
        }
        if (promoImages[0]) formData.append("image", promoImages[0]);
      }

      const res = await fetch(API, {
        method: "POST",
        headers: { "x-auth-token": currentToken },
        body: formData
      });

      const responseText = await res.text();
      console.log("📄 Resposta promo:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Resposta inválida");
      }

      if (res.ok) {
        alert("✅ Promoção cadastrada!");
        formPromo.reset();
        const fileInput = document.getElementById("promoImages");
        if (fileInput) fileInput.value = "";
      } else {
        alert("❌ " + (data.msg || "Erro"));
      }

    } catch (error) {
      console.error("Erro:", error);
      alert("❌ " + error.message);
    }

    btnSubmit.disabled = false;
    btnSubmit.innerText = "🔥 Adicionar Promoção";
  });
}