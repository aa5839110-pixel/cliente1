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
  const imagensProduto = [];
  if (produto.image) imagensProduto.push(produto.image);
  if (produto.images && produto.images.length) imagensProduto.push(...produto.images);
  const imagensUnicas = [...new Set(imagensProduto)];
  return imagensUnicas.length > 0 ? imagensUnicas[0] : "";
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
          <img src="${imgSrc}" class="produto-imagem" onclick="visualizarImagem('${p._id}')">
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
    if (total <= 0) alerta = `<span class="badge-zerado">SEM ESTOQUE</span>`;
    else if (total <= 3) alerta = `<span class="badge-baixo">ÚLTIMAS UNIDADES</span>`;
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
      <button onclick="gerarPDFProduto('${p._id}')">📄 Gerar PDF</button>
      <button onclick="copiarTexto('${escapeJs(p.name)}','${p.price1}','${escapeJs(obterImagem(p))}')">📋 Copiar</button>
    `;
    if (!isVendedorExterno) {
      botoes += `<button onclick="abrirModal('${p._id}')">✏️ Editar</button>`;
    }
    const imgSrc = p.image || (p.images && p.images[0]) || "";
    return `
      <div class="product-card">
        <img src="${imgSrc}" class="produto-imagem" onclick="visualizarImagem('${p._id}')">
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
          <div class="card-buttons">${botoes}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================
   ESCAPE
========================= */
function escapeJs(texto) {
  return String(texto).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

/* =========================
   CATEGORIAS
========================= */
function atualizarCategorias() {
  const categorias = [...new Set(todosProdutos.map(p => p.category).filter(Boolean))];
  categoriaFiltro.innerHTML = `<option value="">Todas categorias</option>${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join("")}`;
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
   TEXTO PARA COPIAR
========================= */
function gerarMensagem(nome, p1, imagem) {
  const preco = Number(p1 || 0).toFixed(2).replace(".", ",");
  return `🛍️ ${nome}\n\n💰 Valor: R$ ${preco}\n\n✨ Produto disponível em nosso catálogo.\n📲 Fale conosco para mais informações.\n\n📷 ${imagem}`;
}
function copiarTexto(nome, p1, imagem) {
  navigator.clipboard.writeText(gerarMensagem(nome, p1, imagem));
  alert("Mensagem copiada!");
}
function compartilharProduto(nome, p1, imagem) {
  const texto = gerarMensagem(nome, p1, imagem);
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

/* =========================
   MODAL EDIÇÃO
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
  document.getElementById("modalImage").src = obterImagem(p);
  // pré-visualização das imagens atuais
  const todasImagens = [];
  if (p.image) todasImagens.push(p.image);
  if (p.images && p.images.length) todasImagens.push(...p.images);
  const previewDiv = document.getElementById("previewImagens");
  if (previewDiv) {
    previewDiv.innerHTML = [...new Set(todasImagens)].map(url => `<img src="${url}" class="img-preview">`).join("");
  }
  const fileInput = document.getElementById("modalImages");
  if (fileInput) fileInput.value = "";
  modal.style.display = "flex";
}

const modalImagesInput = document.getElementById("modalImages");
if (modalImagesInput) {
  modalImagesInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    const previewDiv = document.getElementById("previewImagens");
    if (!previewDiv) return;
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

formEditar.addEventListener("submit", async e => {
  e.preventDefault();
  if (isVendedorExterno) {
    alert("Ação não permitida.");
    return;
  }
  const id = document.getElementById("modalId").value;
  const imageFiles = document.getElementById("modalImages").files;
  const temNovasImagens = imageFiles.length > 0;
  const options = { method: "PUT", headers: { "x-auth-token": token } };
  if (temNovasImagens) {
    const formData = new FormData();
    formData.append("name", document.getElementById("modalName").value);
    formData.append("description", document.getElementById("modalDescription").value);
    formData.append("price1", document.getElementById("modalPrice1").value);
    formData.append("price2", document.getElementById("modalPrice2").value);
    formData.append("stock", document.getElementById("modalStock").value);
    formData.append("category", document.getElementById("modalCategory").value);
    for (let i = 0; i < imageFiles.length; i++) formData.append("images", imageFiles[i]);
    options.body = formData;
  } else {
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
    const res = await fetch(`${API_BASE}/api/products/${id}`, options);
    if (res.ok) {
      modal.style.display = "none";
      carregarProdutos();
      carregarTopVendas();
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
  if (!imagensUnicas.length) {
    alert("Este produto não possui imagens.");
    return;
  }
  const imagemPrincipal = document.getElementById("imagemPrincipal");
  const miniaturasDiv = document.getElementById("miniaturas");
  if (!imagemPrincipal || !miniaturasDiv) return;
  imagemPrincipal.src = imagensUnicas[0];
  miniaturasDiv.innerHTML = imagensUnicas.map(img => `
    <img src="${img}" class="miniatura" style="width:60px;height:60px;object-fit:cover;margin:5px;cursor:pointer;border:2px solid transparent;" 
         onclick="document.getElementById('imagemPrincipal').src='${img}'"
         onmouseover="this.style.borderColor='#007bff'" onmouseout="this.style.borderColor='transparent'">
  `).join("");
  const visualizarModal = document.getElementById("visualizarModal");
  if (visualizarModal) visualizarModal.style.display = "flex";
}

const fecharVisualizar = document.getElementById("fecharVisualizar");
if (fecharVisualizar) {
  fecharVisualizar.onclick = () => {
    const visualizarModal = document.getElementById("visualizarModal");
    if (visualizarModal) visualizarModal.style.display = "none";
  };
}

window.onclick = (e) => {
  const visualizarModal = document.getElementById("visualizarModal");
  if (e.target === visualizarModal) visualizarModal.style.display = "none";
  const modalEdicao = document.getElementById("modal");
  if (e.target === modalEdicao) {
    modalEdicao.style.display = "none";
    document.getElementById("editarProdutoForm").style.display = "block";
    document.getElementById("modalImage").src = "";
  }
};

fecharModal.onclick = () => {
  modal.style.display = "none";
  document.getElementById("editarProdutoForm").style.display = "block";
  document.getElementById("modalImage").src = "";
  document.getElementById("modalImages").value = "";
  document.getElementById("previewImagens").innerHTML = "";
};

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
   GERAR PDF COM EXTRAÇÃO AUTOMÁTICA DE COR, ALTURA, LARGURA, PROFUNDIDADE, PESO
========================= */
async function gerarPDFProduto(id) {
  const produto = todosProdutos.find(p => p._id === id);
  if (!produto) {
    alert("Produto não encontrado");
    return;
  }

  function extrairCor(texto) {
    const cores = ["branco", "preto", "cinza", "prata", "azul", "vermelho", "verde", "amarelo", "rosa", "marrom", "bege", "laranja", "roxo"];
    const textoLower = texto.toLowerCase();
    let match = textoLower.match(/cor:?\s*([a-záãâéêíóôúç]+)/i);
    if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    match = textoLower.match(/na cor\s+([a-záãâéêíóôúç]+)/i);
    if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    for (let cor of cores) {
      if (textoLower.includes(cor)) return cor.charAt(0).toUpperCase() + cor.slice(1);
    }
    return "Não informada";
  }

  function extrairMedida(texto, tipo) {
    const padroes = {
      altura: /(?:altura|alt\.?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(cm|m|mm)/i,
      largura: /(?:largura|larg\.?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(cm|m|mm)/i,
      profundidade: /(?:profundidade|prof\.?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(cm|m|mm)/i,
      peso: /(?:peso|pes\.?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(kg|g)/i
    };
    const regex = padroes[tipo];
    if (!regex) return "Não informado";
    const match = texto.match(regex);
    if (match) {
      let valor = match[1].replace(",", ".");
      let unidade = match[2];
      return `${valor} ${unidade}`;
    }
    return "Não informado";
  }

  const textoAnalise = `${produto.name} ${produto.description || ""}`;
  const cor = extrairCor(textoAnalise);
  const altura = extrairMedida(textoAnalise, "altura");
  const largura = extrairMedida(textoAnalise, "largura");
  const profundidade = extrairMedida(textoAnalise, "profundidade");
  const peso = extrairMedida(textoAnalise, "peso");
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const imagensProduto = [
    ...(produto.image ? [produto.image] : []),
    ...(produto.images || [])
  ];
  const imagensUnicas = [...new Set(imagensProduto)];
  const imagensExibir = imagensUnicas.slice(0, 5);
  const principal = imagensExibir[0] || "";
  const secundarias = imagensExibir.slice(1);

  let miniaturasHTML = "";
  if (secundarias.length > 0) {
    miniaturasHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; gap: 12px;">
          ${secundarias[0] ? `<img src="${secundarias[0]}" style="width:150px; height:150px; object-fit:cover; border-radius:8px;">` : ''}
          ${secundarias[1] ? `<img src="${secundarias[1]}" style="width:150px; height:150px; object-fit:cover; border-radius:8px;">` : ''}
        </div>
        <div style="display: flex; gap: 12px;">
          ${secundarias[2] ? `<img src="${secundarias[2]}" style="width:150px; height:150px; object-fit:cover; border-radius:8px;">` : ''}
          ${secundarias[3] ? `<img src="${secundarias[3]}" style="width:150px; height:150px; object-fit:cover; border-radius:8px;">` : ''}
        </div>
      </div>
    `;
  }

  const imagensHTML = `
    <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
      <div style="flex: 1; min-width: 200px;">
        <img src="${principal}" style="width:100%; max-height: 300px; object-fit: cover; border-radius: 16px;">
      </div>
      <div style="flex: 0.8; min-width: 240px;">
        ${miniaturasHTML}
      </div>
    </div>
  `;

  // Cria o elemento completo
  const contentDiv = document.createElement("div");
  contentDiv.style.width = "750px";
  contentDiv.style.margin = "0 auto";
  contentDiv.style.background = "white";
  contentDiv.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  contentDiv.style.padding = "0";
  contentDiv.innerHTML = `
    <div style="max-width: 750px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
      <div style="background: linear-gradient(135deg, #ffbc02, #e79600); padding: 10px; text-align: center; color: white;">
        <h1 style="margin:0; font-size: 28px;">🏬 TEIXEIRA MÓVEIS</h1>
        <p style="margin:5px 0 0; opacity:0.9;">Qualidade e confiança para sua casa</p>
      </div>
      <div style="padding: 40px;">
        <h2 style="margin:0 0 20px; font-size: 22px; color:#1e3c72; border-left:5px solid #ff9800; padding-left:15px;">${produto.name}</h2>
        ${imagensHTML}
        <div style="background: #f8f9fc; padding: 20px; border-radius: 20px; margin-bottom: 25px;">
          <h3 style="margin:0 0 15px; color:#1e3c72;">📋 Especificações</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 12px;">
            <div><strong>🎨 Cor:</strong><br> ${cor}</div>
            <div><strong>📏 Altura:</strong><br> ${altura}</div>
            <div><strong>📐 Largura:</strong><br> ${largura}</div>
            <div><strong>📏 Profundidade:</strong><br> ${profundidade}</div>
            <div><strong>⚖️ Peso:</strong><br> ${peso}</div>
          </div>
        </div>
        <div>
          <h3 style="color:#1e3c72; border-bottom: 2px solid #ff9800; display: inline-block; margin-bottom: 12px;">📌 MAIS INFORMAÇÕES</h3>
          <p style="line-height: 1.5; background: #fafafa; padding: 16px; border-radius: 16px; margin-top: 8px;">${produto.description || "Sem descrição adicional"}</p>
        </div>
      </div>
      <div style="background: #1e3c72; color: white; text-align: center; padding: 12px; font-size: 12px;">
        📞 (88) 9XXXX-XXXX | 📧 contato@teixeiramoveis.com | @teixeiramoveis<br>
        Gerado em ${dataAtual}
      </div>
    </div>
  `;

  // Adiciona ao DOM
  document.body.appendChild(contentDiv);
  contentDiv.style.position = "fixed";
  contentDiv.style.top = "0";
  contentDiv.style.left = "0";
  contentDiv.style.zIndex = "-9999";

  // Aguarda imagens carregarem
  const imgs = contentDiv.querySelectorAll("img");
  await Promise.all([...imgs].map(img => {
    return new Promise(resolve => {
      img.crossOrigin = "anonymous";
      if (img.complete) resolve();
      else { img.onload = resolve; img.onerror = resolve; }
    });
  }));
  await new Promise(r => setTimeout(r, 300));

  // Configurações do PDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10; // margem em mm

  // Converte o elemento para canvas
  const canvas = await html2canvas(contentDiv, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false
  });
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Adiciona primeira página
  pdf.addImage(imgData, "PNG", margin, position + margin, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight - margin * 2;

  // Adiciona páginas extras se necessário
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position + margin, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`${produto.name.replace(/[^a-z0-9]/gi, "_")}.pdf`);

  // Remove o elemento
  document.body.removeChild(contentDiv);
}

/* =========================
   INICIAR
========================= */
carregarProdutos();
carregarTopVendas();