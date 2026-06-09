const API_BASE = "https://catalogo-h0ro.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

/* =========================
   VARIÁVEL GLOBAL
========================= */
let isVendedorExterno = false;
let todosProdutos = [];

/* =========================
   FUNÇÃO PARA OBTER IMAGEM
   (prioriza image, depois images[0])
========================= */
function obterImagem(produto) {
  if (produto.image) return produto.image;
  if (produto.images && produto.images.length > 0) {
    return produto.images[0];
  }
  return "";
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
   CARREGAR PRODUTOS (COM +20% SE VENDEDOR EXTERNO)
========================= */
async function carregarProdutos() {
  container.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    let produtos = await res.json();

    isVendedorExterno = localStorage.getItem("isVendedorExterno") === "true";

    if (isVendedorExterno) {
      produtos = produtos.map(prod => ({
        ...prod,
        price1: prod.price1 * 1.2,
        price2: prod.price1 * 1.2
      }));
      console.log("✅ Preços ajustados com +20% para vendedor externo");
    }

    todosProdutos = produtos;

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

      const imgSrc = obterImagem(p);
      return `
        <div class="top-card">
          <img
            src="${imgSrc}"
            class="produto-imagem"
            onclick="visualizarImagem('${p._id}')"
          >
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

    let precoHTML = "";
    if (isVendedorExterno) {
      precoHTML = `<strong>💰 Preço à vista: R$ ${Number(p.price1 || 0).toFixed(2)}</strong>`;
    } else {
      precoHTML = `
        <strong>Tabela 1: R$ ${Number(p.price1 || 0).toFixed(2)}</strong>
        <strong>Tabela 2: R$ ${Number(p.price2 || 0).toFixed(2)}</strong>
      `;
    }

    let botoes = `
      <button onclick="compartilharProduto(
        '${escapeJs(p.name)}',
        '${p.price1}',
        '${escapeJs(obterImagem(p))}'
      )">
        📲 Compartilhar
      </button>
      <button onclick="copiarTexto(
        '${escapeJs(p.name)}',
        '${p.price1}',
        '${escapeJs(obterImagem(p))}'
      )">
        📋 Copiar
      </button>
    `;

    if (!isVendedorExterno) {
      botoes += `<button onclick="abrirModal('${p._id}')">✏️ Editar</button>`;
    }

    const imgSrc = p.image || (p.images && p.images[0]) || "";
    return `
      <div class="product-card">
        <img
          src="${imgSrc}"
          class="produto-imagem"
          onclick="visualizarImagem('${p._id}')"
        >
        <div class="product-info">
          ${alerta}
          <h3>${p.name}</h3>
          <p>${p.description || "Sem descrição"}</p>
          ${precoHTML}
          <small>ID: ${p.productId || "-"}</small>
          <small>${p.category || "-"}</small>
          <div class="estoque-box ${estoqueClasse}">
            <small>🏬 Loja 1: ${l1}</small>
            <small>🏬 Loja 5: ${l5}</small>
            <small><strong>📦 Total: ${total}</strong></small>
          </div>
          <div class="card-buttons">
            ${botoes}
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

  categoriaFiltro.innerHTML = `
    <option value="">Todas categorias</option>
    ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
  `;
}

/* =========================
   FILTROS
========================= */
function aplicarFiltros() {
  const texto = buscaInput.value.toLowerCase();
  const categoria = categoriaFiltro.value;

  const filtrados = todosProdutos.filter(p => {
    const nomeOk = p.name?.toLowerCase().includes(texto);
    const idOk = p.productId?.toLowerCase().includes(texto);
    const categoriaOk = !categoria || p.category === categoria;
    return (nomeOk || idOk) && categoriaOk;
  });

  exibirProdutos(filtrados);
}

buscaInput.addEventListener("input", aplicarFiltros);
categoriaFiltro.addEventListener("change", aplicarFiltros);

/* =========================
   TEXTO PARA COMPARTILHAR/COPIAR
========================= */
function gerarMensagem(nome, p1, imagem) {
  const preco = Number(p1 || 0)
    .toFixed(2)
    .replace(".", ",");

  return `🛍️ ${nome}\n\n💰 Valor: R$ ${preco}\n\n✨ Produto disponível em nosso catálogo.\n📲 Fale conosco para mais informações.\n\n📷 ${imagem}`;
}

function copiarTexto(nome, p1, imagem) {
  navigator.clipboard.writeText(gerarMensagem(nome, p1, imagem));
  alert("Mensagem copiada!");
}

function compartilharProduto(nome, p1, imagem) {
  const texto = gerarMensagem(nome, p1, imagem);
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

/* =========================
   MODAL (EDIÇÃO COM UPLOAD DE MÚLTIPLAS IMAGENS)
========================= */
async function abrirModal(id) {
  if (isVendedorExterno) {
    alert("Acesso negado.");
    return;
  }

  const res = await fetch(`${API_BASE}/api/products/${id}`);
  const p = await res.json();

  document.getElementById("modalId").value = p._id;
  document.getElementById("modalName").value = p.name;
  document.getElementById("modalDescription").value = p.description;
  document.getElementById("modalPrice1").value = p.price1;
  document.getElementById("modalPrice2").value = p.price2;
  document.getElementById("modalStock").value = p.stockTotal || p.stock;
  document.getElementById("modalCategory").value = p.category;
  document.getElementById("modalImageURL").value = p.image;

  const imgSrc = obterImagem(p);
  document.getElementById("modalImage").src = imgSrc;

  // Exibir pré-visualização das imagens atuais
  const todasImagens = [];
  if (p.image) todasImagens.push(p.image);
  if (p.images && p.images.length) todasImagens.push(...p.images);
  const uniqueImagens = [...new Set(todasImagens)];
  const previewDiv = document.getElementById("previewImagens");
  if (previewDiv) {
    previewDiv.innerHTML = uniqueImagens.map(url => `
      <img src="${url}" class="img-preview">
    `).join("");
  }

  // Limpar input de arquivo anterior
  const fileInput = document.getElementById("modalImages");
  if (fileInput) fileInput.value = "";

  modal.style.display = "flex";
}

// Pré-visualização ao selecionar novas imagens
const modalImagesInput = document.getElementById("modalImages");
if (modalImagesInput) {
  modalImagesInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    const previewDiv = document.getElementById("previewImagens");
    if (!previewDiv) return;
    // Limpa prévia atual (mostra apenas as novas selecionadas)
    previewDiv.innerHTML = "";
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.classList.add("img-preview");
        previewDiv.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

/* =========================
   SALVAR EDIÇÃO (COM OU SEM NOVAS IMAGENS)
========================= */
formEditar.addEventListener("submit", async e => {
  e.preventDefault();

  if (isVendedorExterno) {
    alert("Ação não permitida.");
    return;
  }

  const id = document.getElementById("modalId").value;
  const imageFiles = document.getElementById("modalImages").files;
  const temNovasImagens = imageFiles.length > 0;

  let url = `${API_BASE}/api/products/${id}`;
  let options = {
    method: "PUT",
    headers: { "x-auth-token": token }
  };

  if (temNovasImagens) {
    // Enviar como FormData
    const formData = new FormData();
    formData.append("name", document.getElementById("modalName").value);
    formData.append("description", document.getElementById("modalDescription").value);
    formData.append("price1", document.getElementById("modalPrice1").value);
    formData.append("price2", document.getElementById("modalPrice2").value);
    formData.append("stock", document.getElementById("modalStock").value);
    formData.append("category", document.getElementById("modalCategory").value);
    // Adiciona as imagens
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append("images", imageFiles[i]);
    }
    options.body = formData;
    // Não setar Content-Type
  } else {
    // Enviar como JSON (sem alterar imagens)
    const dados = {
      name: document.getElementById("modalName").value,
      description: document.getElementById("modalDescription").value,
      price1: document.getElementById("modalPrice1").value,
      price2: document.getElementById("modalPrice2").value,
      stock: document.getElementById("modalStock").value,
      category: document.getElementById("modalCategory").value
    };
    options.headers = { "Content-Type": "application/json", "x-auth-token": token };
    options.body = JSON.stringify(dados);
  }

  try {
    const res = await fetch(url, options);
    if (res.ok) {
      modal.style.display = "none";
      carregarProdutos();
      carregarTopVendas();
      // Limpar campos
      document.getElementById("modalImages").value = "";
      document.getElementById("previewImagens").innerHTML = "";
      alert("✅ Produto atualizado com sucesso!");
    } else {
      const error = await res.json();
      alert("❌ Erro: " + (error.msg || "Não foi possível atualizar"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Erro de conexão ao atualizar produto");
  }
});

/* =========================
   VISUALIZAR IMAGEM (GALERIA)
========================= */
function visualizarImagem(id) {
  const produto = todosProdutos.find(p => p._id === id);
  if (!produto) return;

  const imagens = [];
  if (produto.image) imagens.push(produto.image);
  if (produto.images && produto.images.length) imagens.push(...produto.images);
  const imagensUnicas = [...new Set(imagens)];
  if (imagensUnicas.length === 0) {
    alert("Este produto não possui imagens.");
    return;
  }

  const imagemPrincipal = document.getElementById("imagemPrincipal");
  const miniaturasDiv = document.getElementById("miniaturas");

  if (!imagemPrincipal || !miniaturasDiv) {
    console.error("Elementos do modal de visualização não encontrados");
    return;
  }

  imagemPrincipal.src = imagensUnicas[0];
  miniaturasDiv.innerHTML = imagensUnicas.map(img => `
    <img
      src="${img}"
      class="miniatura"
      onclick="document.getElementById('imagemPrincipal').src='${img}'"
      style="width: 60px; height: 60px; object-fit: cover; margin: 5px; cursor: pointer; border: 2px solid transparent;"
      onmouseover="this.style.borderColor='#007bff'"
      onmouseout="this.style.borderColor='transparent'"
    >
  `).join("");

  const visualizarModal = document.getElementById("visualizarModal");
  if (visualizarModal) visualizarModal.style.display = "flex";
}

/* =========================
   FECHAR MODAL DE VISUALIZAÇÃO
========================= */
const fecharVisualizar = document.getElementById("fecharVisualizar");
if (fecharVisualizar) {
  fecharVisualizar.onclick = () => {
    const visualizarModal = document.getElementById("visualizarModal");
    if (visualizarModal) visualizarModal.style.display = "none";
  };
}

// Fechar visualização ao clicar fora
window.onclick = (e) => {
  const visualizarModal = document.getElementById("visualizarModal");
  if (e.target === visualizarModal) {
    visualizarModal.style.display = "none";
  }
  const modalEdicao = document.getElementById("modal");
  if (e.target === modalEdicao) {
    modalEdicao.style.display = "none";
    document.getElementById("editarProdutoForm").style.display = "block";
    document.getElementById("modalImage").src = "";
  }
};

/* =========================
   FECHAR MODAL DE EDIÇÃO
========================= */
fecharModal.onclick = () => {
  modal.style.display = "none";
  document.getElementById("editarProdutoForm").style.display = "block";
  document.getElementById("modalImage").src = "";
  // Limpar preview e input de arquivo
  document.getElementById("modalImages").value = "";
  document.getElementById("previewImagens").innerHTML = "";
};

/* =========================
   EXCLUIR PRODUTO
========================= */
excluirBtn.onclick = async () => {
  if (isVendedorExterno) {
    alert("Ação não permitida.");
    return;
  }
  if (!confirm("Deseja excluir este produto?")) return;

  const id = document.getElementById("modalId").value;
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: { "x-auth-token": token }
  });

  if (res.ok) {
    modal.style.display = "none";
    carregarProdutos();
    carregarTopVendas();
    alert("✅ Produto excluído com sucesso!");
  } else {
    alert("❌ Erro ao excluir produto");
  }
};

/* =========================
   INICIAR
========================= */
carregarProdutos();
carregarTopVendas();