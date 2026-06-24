/* ===============================
   CLIENTE.JS
================================= */

const API_BASE = "https://cliente1-jucivan.onrender.com";

const produtosDiv = document.getElementById("produtos");
const buscaInput = document.getElementById("busca");
const categoriasDiv = document.getElementById("categorias");

let todosProdutos = [];
let categoriaAtual = "";

/* ===============================
   CARREGAR PRODUTOS
================================= */
async function carregarProdutos() {
  produtosDiv.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const produtos = await res.json();

    // apenas produtos com estoque
    todosProdutos = produtos.filter(p => Number(p.stock) > 0);

    renderCategorias();
    renderProdutos(todosProdutos);

  } catch (error) {
    console.error(error);
    produtosDiv.innerHTML = "<p>Erro ao carregar catálogo.</p>";
  }
}

/* ===============================
   RENDER PRODUTOS
================================= */
function renderProdutos(lista) {

  if (!lista.length) {
    produtosDiv.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  produtosDiv.innerHTML = lista.map(p => `
    <div class="card">

      <img src="${p.image || 'https://via.placeholder.com/300'}">

      <div class="info">

        <h3>${p.name}</h3>

        <p class="desc">
          ${p.description || "Produto disponível em nossa loja"}
        </p>

        <div class="preco">
          R$ ${Number(p.price1 || 0).toFixed(2).replace(".", ",")}
        </div>

        <div class="estoque">
          Estoque disponível
        </div>

        <div class="btns">

          <button class="btn btn-zap"
            onclick="comprarWhats('${escapeText(p.name)}','${p.price1}')">
            Comprar
          </button>

          <button class="btn btn-ver"
            onclick="verProduto('${escapeText(p.name)}','${escapeText(p.description)}','${p.price1}','${p.image}')">
            Ver Mais
          </button>

        </div>

      </div>

    </div>
  `).join("");
}

/* ===============================
   WHATSAPP
================================= */
function comprarWhats(nome, preco) {

  const texto = `Olá! Tenho interesse no produto:

🛍️ ${nome}
💰 Valor: R$ ${Number(preco).toFixed(2).replace(".", ",")}

Pode me passar mais informações?`;

  const url =
    `https://wa.me/5588999999999?text=${encodeURIComponent(texto)}`;

  window.open(url, "_blank");
}

/* ===============================
   VER PRODUTO
================================= */
function verProduto(nome, desc, preco, img) {

  alert(
`${nome}

${desc}

Valor: R$ ${Number(preco).toFixed(2).replace(".", ",")}`
  );
}

/* ===============================
   BUSCA
================================= */
buscaInput.addEventListener("input", aplicarFiltros);

function aplicarFiltros() {

  const termo = buscaInput.value.toLowerCase();

  let filtrados = todosProdutos.filter(p => {

    const nomeOk =
      p.name?.toLowerCase().includes(termo);

    const categoriaOk =
      !categoriaAtual ||
      p.category === categoriaAtual;

    return nomeOk && categoriaOk;
  });

  renderProdutos(filtrados);
}

/* ===============================
   CATEGORIAS
================================= */
function renderCategorias() {

  const categorias = [
    ...new Set(
      todosProdutos
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  categoriasDiv.innerHTML = `
    <button onclick="filtrarCategoria('')">
      Todas
    </button>

    ${categorias.map(cat => `
      <button onclick="filtrarCategoria('${escapeText(cat)}')">
        ${cat}
      </button>
    `).join("")}
  `;
}

function filtrarCategoria(cat) {
  categoriaAtual = cat;
  aplicarFiltros();
}

/* ===============================
   ESCAPAR TEXTO
================================= */
function escapeText(texto) {
  return String(texto)
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

/* ===============================
   INICIAR
================================= */
carregarProdutos();