const API_BASE = "https://catalogo-h0ro.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

/* =========================
   ELEMENTOS
========================= */
const container = document.getElementById("productsContainer");
const buscaInput = document.getElementById("busca");
const categoriaFiltro = document.getElementById("categoriaFiltro");

const modal = document.getElementById("modal");
const fecharModal = document.getElementById("fecharModal");

const formEditar = document.getElementById("editarProdutoForm");
const excluirBtn = document.getElementById("excluirProduto");

const topSales = document.getElementById("topSales");

let todosProdutos = [];

/* =========================
   SPLASH
========================= */
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("welcomeScreen");
    if (splash) splash.style.display = "none";
  }, 1200);
});

/* =========================
   CARREGAR PRODUTOS
========================= */
async function carregarProdutos() {
  container.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    todosProdutos = await res.json();

    atualizarCategorias();
    exibirProdutos(todosProdutos);

  } catch (error) {
    container.innerHTML = "<p>Erro ao carregar produtos.</p>";
  }
}

/* =========================
   TOP VENDAS
========================= */
async function carregarTopVendas() {
  if (!topSales) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/top-sales/list`);
    const lista = await res.json();

    if (!lista.length) {
      topSales.innerHTML = "<p>Nenhuma venda registrada.</p>";
      return;
    }

    topSales.innerHTML = lista.map((p, i) => {
      let medalha = "🏅";

      if (i === 0) medalha = "🥇";
      if (i === 1) medalha = "🥈";
      if (i === 2) medalha = "🥉";

      return `
        <div class="top-card">
          <img src="${p.image || 'https://via.placeholder.com/150'}">

          <div class="top-info">
            <h3>${medalha} ${p.name}</h3>
            <span>${p.salesCount || 0} vendas</span>
          </div>
        </div>
      `;
    }).join("");

  } catch {
    topSales.innerHTML = "<p>Erro ao carregar ranking.</p>";
  }
}

/* =========================
   EXIBIR PRODUTOS
========================= */
function exibirProdutos(lista) {

  if (!lista.length) {
    container.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  container.innerHTML = lista.map(p => {

    const l1 = Number(p.stockL1 || 0);
    const l5 = Number(p.stockL5 || 0);
    const total = Number(p.stockTotal || p.stock || 0);

    let estoqueClasse = "verde";

    if (total <= 0) estoqueClasse = "vermelho";
    else if (total <= 5) estoqueClasse = "amarelo";

    let alerta = "";

    if (total <= 0) {
      alerta = `<span class="badge-zerado">SEM ESTOQUE</span>`;
    } else if (total <= 3) {
      alerta = `<span class="badge-baixo">ÚLTIMAS UNIDADES</span>`;
    }

    return `
      <div class="product-card">

        <img src="${p.image || 'https://via.placeholder.com/300'}">

        <div class="product-info">

          ${alerta}

          <h3>${p.name}</h3>

          <p>${p.description || "Sem descrição"}</p>

          <strong>Tabela 1: R$ ${Number(p.price1 || 0).toFixed(2)}</strong>
          <strong>Tabela 2: R$ ${Number(p.price2 || 0).toFixed(2)}</strong>

          <small>ID: ${p.productId || "-"}</small>
          <small>${p.category || "-"}</small>

          <div class="estoque-box ${estoqueClasse}">
            <small>🏬 Loja 1: ${l1}</small>
            <small>🏬 Loja 5: ${l5}</small>
            <small><strong>📦 Total: ${total}</strong></small>
          </div>

          <div class="card-buttons">

            <button onclick="compartilharProduto(
              '${escapeJs(p.name)}',
              '${p.price1}',
              '${escapeJs(p.image || "")}'
            )">
              📲 Compartilhar
            </button>

            <button onclick="copiarTexto(
              '${escapeJs(p.name)}',
              '${p.price1}',
              '${escapeJs(p.image || "")}'
            )">
              📋 Copiar
            </button>

            <button onclick="abrirModal('${p._id}')">
              ✏️ Editar
            </button>

          </div>

        </div>
      </div>
    `;
  }).join("");
}

/* =========================
   ESCAPE
========================= */
function escapeJs(texto) {
  return String(texto)
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

/* =========================
   CATEGORIAS
========================= */
function atualizarCategorias() {
  const categorias = [
    ...new Set(
      todosProdutos
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  categoriaFiltro.innerHTML =
    `<option value="">Todas categorias</option>` +
    categorias.map(cat =>
      `<option value="${cat}">${cat}</option>`
    ).join("");
}

/* =========================
   FILTROS
========================= */
function aplicarFiltros() {
  const texto = buscaInput.value.toLowerCase();
  const categoria = categoriaFiltro.value;

  const filtrados = todosProdutos.filter(p => {

    const nomeOk =
      p.name?.toLowerCase().includes(texto);

    const idOk =
      p.productId?.toLowerCase().includes(texto);

    const categoriaOk =
      !categoria || p.category === categoria;

    return (nomeOk || idOk) && categoriaOk;
  });

  exibirProdutos(filtrados);
}

buscaInput.addEventListener("input", aplicarFiltros);
categoriaFiltro.addEventListener("change", aplicarFiltros);

/* =========================
   TEXTO
========================= */
function gerarMensagem(nome, p1, imagem) {
  const preco = Number(p1 || 0)
    .toFixed(2)
    .replace(".", ",");

  return `🛍️ ${nome}

💰 Valor: R$ ${preco}

✨ Produto disponível em nosso catálogo.
📲 Fale conosco para mais informações.

📷 ${imagem}`;
}

/* =========================
   COPIAR
========================= */
function copiarTexto(nome, p1, imagem) {
  navigator.clipboard.writeText(
    gerarMensagem(nome, p1, imagem)
  );

  alert("Mensagem copiada!");
}

/* =========================
   WHATSAPP
========================= */
function compartilharProduto(nome, p1, imagem) {
  const texto =
    gerarMensagem(nome, p1, imagem);

  const url =
    `https://wa.me/?text=${encodeURIComponent(texto)}`;

  window.open(url, "_blank");
}

/* =========================
   MODAL
========================= */
async function abrirModal(id) {

  const res =
    await fetch(`${API_BASE}/api/products/${id}`);

  const p = await res.json();

  document.getElementById("modalId").value = p._id;
  document.getElementById("modalName").value = p.name;
  document.getElementById("modalDescription").value = p.description;
  document.getElementById("modalPrice1").value = p.price1;
  document.getElementById("modalPrice2").value = p.price2;
  document.getElementById("modalStock").value = p.stockTotal || p.stock;
  document.getElementById("modalCategory").value = p.category;
  document.getElementById("modalImageURL").value = p.image;

  document.getElementById("modalImage").src =
    p.image || "https://via.placeholder.com/300";

  modal.style.display = "flex";
}

fecharModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

/* =========================
   SALVAR
========================= */
formEditar.addEventListener("submit", async e => {

  e.preventDefault();

  const id =
    document.getElementById("modalId").value;

  const dados = {
    name: document.getElementById("modalName").value,
    description: document.getElementById("modalDescription").value,
    price1: document.getElementById("modalPrice1").value,
    price2: document.getElementById("modalPrice2").value,
    stock: document.getElementById("modalStock").value,
    category: document.getElementById("modalCategory").value,
    image: document.getElementById("modalImageURL").value
  };

  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": token
    },
    body: JSON.stringify(dados)
  });

  if (res.ok) {
    modal.style.display = "none";
    carregarProdutos();
    carregarTopVendas();
  }
});

/* =========================
   EXCLUIR
========================= */
excluirBtn.onclick = async () => {

  if (!confirm("Deseja excluir este produto?")) return;

  const id =
    document.getElementById("modalId").value;

  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: {
      "x-auth-token": token
    }
  });

  if (res.ok) {
    modal.style.display = "none";
    carregarProdutos();
    carregarTopVendas();
  }
};

/* =========================
   INICIAR
========================= */
carregarProdutos();
carregarTopVendas();