"use strict";

/*==================== API ====================*/
const API = "https://cliente1-jucivan.onrender.com/api/products";

/*==================== ELEMENTOS ====================*/
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchProduct");
const results = document.getElementById("searchResults");
const selectedDiv = document.getElementById("selectedProducts");
const generateBtn = document.getElementById("generatePoster"); // <-- NOVO

/*==================== ESTADO ====================*/
const selected = [];

/*==================== PESQUISAR ====================*/
searchBtn.onclick = async () => {
  const text = searchInput.value.trim().toLowerCase();
  if (!text) return;

  const res = await fetch(API);
  const products = await res.json();

  const filtered = products.filter(product => {
    const id = String(product.productId || "").toLowerCase();
    const name = (product.name || "").toLowerCase();
    return id.includes(text) || name.includes(text);
  });

  renderResults(filtered);
};

/*==================== RENDERIZAR RESULTADOS ====================*/
function renderResults(products) {
  results.innerHTML = "";

  if (products.length === 0) {
    results.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-box-open"></i>
        <p>Nenhum produto encontrado.</p>
      </div>`;
    return;
  }

  products.forEach(product => {
    const image = product.image && product.image.trim() !== ""
      ? product.image
      : "./img/sem-imagem.png";

    const price = Number(product.price1 || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    results.innerHTML += `
      <div class="product-card">
        <img src="${image}" 
             alt="${product.name || "Produto"}" 
             class="product-image"
             onerror="this.onerror=null; this.src='./img/sem-imagem.png';">
        <div class="product-info">
          <h3>${product.name || "Sem nome"}</h3>
          <p>ID ${product.productId || "-"}</p>
          <span class="price">R$ ${price}</span>
        </div>
        <button class="add-btn" onclick="addProduct('${product._id}')">
          <i class="fa-solid fa-plus"></i> Adicionar
        </button>
      </div>`;
  });
}

/*==================== ADICIONAR PRODUTO ====================*/
window.addProduct = async (id) => {
  if (selected.find(p => p._id === id)) return;

  const res = await fetch(`${API}/${id}`);
  const product = await res.json();
  selected.push(product);
  renderSelected();
};

/*==================== RENDERIZAR SELECIONADOS ====================*/
function renderSelected() {
  selectedDiv.innerHTML = "";

  if (selected.length === 0) {
    selectedDiv.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-image"></i>
        <p>Nenhum produto selecionado.</p>
      </div>`;
    return;
  }

  selected.forEach(product => {
    const image = product.image && product.image.trim() !== ""
      ? product.image
      : "./img/sem-imagem.png";

    const price = Number(product.price1 || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2
    });

    selectedDiv.innerHTML += `
      <div class="preview-card">
        <img src="${image}" 
             class="preview-image" 
             alt="${product.name}"
             onerror="this.onerror=null; this.src='./img/sem-imagem.png';">
        <div class="preview-info">
          <h3>${product.name}</h3>
          <p>ID ${product.productId || "-"}</p>
          <span class="price">R$ ${price}</span>
        </div>
        <button class="remove-btn" onclick="removeProduct('${product._id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
  });
}

/*==================== REMOVER PRODUTO ====================*/
window.removeProduct = (id) => {
  const index = selected.findIndex(p => p._id === id);
  if (index > -1) {
    selected.splice(index, 1);
    renderSelected();
  }
};

/*==================== GERAR CARTAZ ====================*/
// Função do botão "Gerar Cartaz"
generateBtn.onclick = () => {
  // 1. Validar se há produtos selecionados
  if (selected.length === 0) {
    alert("Selecione pelo menos um produto.");
    return;
  }

  // 2. Capturar dados do formulário
  const title = document.getElementById("campaignTitle").value.trim() || "SEMANA DA RENOVAÇÃO";
  const subtitle = document.getElementById("campaignSubtitle").value.trim() || "Até 12x sem juros";
  const model = document.getElementById("posterModel").value;

  // 3. Montar objeto com os dados
  const data = {
    title: title,
    subtitle: subtitle,
    model: model,
    products: selected // array de produtos selecionados
  };

  // 4. Salvar no localStorage e redirecionar
  localStorage.setItem("posterData", JSON.stringify(data));
  window.location.href = "poster.html";
};