const API_BASE = "https://cliente1-jucivan.onrender.com/api/products";

let produtos = [];
let produtosFiltrados = [];
let carrinho = [];

/* ===============================
   TABELA CARNÊ
=================================*/
const tabelaCarne = {
  3: 0.43264,
  4: 0.33822,
  5: 0.28188,
  6: 0.24458,
  7: 0.20892,
  8: 0.18942,
  9: 0.17439,
  10: 0.16249,
  11: 0.15287,
  12: 0.14224,
  13: 0.13204,
  14: 0.12634,
  15: 0.12145
};

/* ===============================
   ELEMENTOS
=================================*/
const buscaInput = document.getElementById("buscaProduto");
const produtoSelect = document.getElementById("produtoSelect");
const precoProduto = document.getElementById("precoProduto");
const quantidadeProduto = document.getElementById("quantidadeProduto");
const listaProdutos = document.getElementById("listaProdutos");

const lojaSelect = document.getElementById("loja");
const formaPagamento = document.getElementById("formaPagamento");
const parcelasSelect = document.getElementById("parcelas");

/* ===============================
   INICIAR
=================================*/
window.onload = () => {
  carregarProdutos();

  document.getElementById("addProduto").onclick = adicionarProduto;
  document.getElementById("calcularBtn").onclick = calcular;
  document.getElementById("copiarBtn").onclick = copiarMensagem;
  document.getElementById("whatsBtn").onclick = enviarWhatsapp;
};

/* ===============================
   CARREGAR PRODUTOS
=================================*/
async function carregarProdutos() {
  try {
    const res = await fetch(API_BASE);
    produtos = await res.json();

    produtosFiltrados = [...produtos];
    preencherSelect(produtosFiltrados);

  } catch (error) {
    alert("Erro ao carregar produtos.");
    console.log(error);
  }
}

/* ===============================
   PREENCHER SELECT
=================================*/
function preencherSelect(lista) {
  produtoSelect.innerHTML = `
    <option value="">Selecione produto</option>
  `;

  lista.forEach((p, i) => {
    produtoSelect.innerHTML += `
      <option value="${i}">
        ${p.productId || "-"} | ${p.name}
      </option>
    `;
  });
}

/* ===============================
   BUSCAR PRODUTO
=================================*/
function buscarProduto() {
  const termo = buscaInput.value.toLowerCase().trim();

  produtosFiltrados = produtos.filter(p =>
    p.name.toLowerCase().includes(termo) ||
    String(p.productId).toLowerCase().includes(termo)
  );

  preencherSelect(produtosFiltrados);

  if (produtosFiltrados.length === 1) {
    produtoSelect.selectedIndex = 1;
    preencherPreco();
  }
}

buscaInput.addEventListener("input", buscarProduto);

buscaInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    buscarProduto();
  }
});

/* ===============================
   ESCOLHER PRODUTO
=================================*/
produtoSelect.addEventListener("change", preencherPreco);

function preencherPreco() {
  const index = produtoSelect.value;

  if (index === "") return;

  const produto = produtosFiltrados[index];

  precoProduto.value = Number(produto.price1).toFixed(2);
}

/* ===============================
   ADICIONAR PRODUTO
=================================*/
function adicionarProduto() {
  const index = produtoSelect.value;

  if (index === "") {
    alert("Selecione um produto.");
    return;
  }

  const produto = produtosFiltrados[index];

  carrinho.push({
    nome: produto.name,
    valor: Number(precoProduto.value),
    qtd: Number(quantidadeProduto.value || 1)
  });

  renderCarrinho();

  buscaInput.value = "";
  quantidadeProduto.value = 1;
}

/* ===============================
   RENDER CARRINHO
=================================*/
function renderCarrinho() {
  if (!carrinho.length) {
    listaProdutos.innerHTML =
      `<p class="vazio">Nenhum produto adicionado.</p>`;
    calcular();
    return;
  }

  listaProdutos.innerHTML = "";

  carrinho.forEach((item, i) => {
    listaProdutos.innerHTML += `
      <div class="item-orcamento">
        <strong>${item.nome}</strong>

        <p>${item.qtd}x R$ ${item.valor.toFixed(2)}</p>

        <button onclick="removerItem(${i})">
          ❌
        </button>
      </div>
    `;
  });

  calcular();
}

/* ===============================
   REMOVER ITEM
=================================*/
function removerItem(i) {
  carrinho.splice(i, 1);
  renderCarrinho();
}

/* ===============================
   TOTAL BASE
=================================*/
function totalBase() {
  let total = 0;

  carrinho.forEach(item => {
    total += item.valor * item.qtd;
  });

  return total;
}

/* ===============================
   CALCULAR
=================================*/
function calcular() {

  const lojaTexto = lojaSelect.value;
  const forma = formaPagamento.value;
  const parcelas = Number(parcelasSelect.value);

  const subtotal = totalBase();

  let total = subtotal;
  let parcelaTexto = "-";

  const loja = lojaTexto.includes("Loja 5") ? 5 : 1;

  /* À VISTA */
  if (forma === "avista") {
    total = subtotal;
    parcelaTexto = "Pagamento à vista";
  }

  /* CARNÊ */
  if (forma === "carne") {
    total = subtotal * 1.20;

    const taxa = tabelaCarne[parcelas];
    const valorParcela = total * taxa;

    parcelaTexto =
      `${parcelas}x de R$ ${valorParcela.toFixed(2)}`;

    total = valorParcela * parcelas;
  }

  /* CARTÃO */
  if (forma === "cartao") {

    if (loja === 1) {
      total = subtotal * 1.20;
    }

    if (loja === 5) {
      total = subtotal;
    }

    const valorParcela = total / parcelas;

    parcelaTexto =
      `${parcelas}x de R$ ${valorParcela.toFixed(2)}`;
  }

  document.getElementById("subtotal").innerText =
    "R$ " + subtotal.toFixed(2);

  document.getElementById("totalFinal").innerText =
    "R$ " + total.toFixed(2);

  document.getElementById("parcelado").innerText =
    parcelaTexto;

  gerarMensagem();
}

/* ===============================
   EVENTOS AUTO
=================================*/
lojaSelect.onchange = calcular;
formaPagamento.onchange = calcular;
parcelasSelect.onchange = calcular;

/* ===============================
   GERAR MENSAGEM BONITA
=================================*/
function gerarMensagem() {

  const cliente =
    document.getElementById("cliente").value || "Cliente";

  const loja =
    document.getElementById("loja").value;

  const forma =
    document.getElementById("formaPagamento").value;

  const total =
    document.getElementById("totalFinal").innerText;

  const parcelas =
    document.getElementById("parcelado").innerText;

  let texto = `✨ *TEIXEIRA MÓVEIS & ELETRO* ✨\n`;
  texto += `━━━━━━━━━━━━━━━━━━\n\n`;

  texto += `👤 *Cliente:* ${cliente}\n`;
  texto += `🏬 *Loja:* ${loja}\n\n`;

  texto += `🛍️ *PRODUTOS ESCOLHIDOS*\n\n`;

  carrinho.forEach((item, i) => {
    texto += `${i + 1}. ${item.nome}\n`;
    texto += `   ▸ Qtd: ${item.qtd}\n`;
    texto += `   ▸ Valor: R$ ${item.valor.toFixed(2)}\n\n`;
  });

  texto += `━━━━━━━━━━━━━━━━━━\n\n`;

  texto += `💰 *TOTAL:* ${total}\n`;
  texto += `💳 *Pagamento:* ${forma.toUpperCase()}\n`;
  texto += `📌 *Condição:* ${parcelas}\n\n`;

  texto += `📲 Fale conosco e finalize seu pedido!\n`;
  texto += `🙏 Obrigado pela preferência.`;

  document.getElementById("mensagemFinal").value = texto;
}

/* ===============================
   COPIAR
=================================*/
function copiarMensagem() {

  const textarea =
    document.getElementById("mensagemFinal");

  textarea.select();
  document.execCommand("copy");

  alert("Mensagem copiada!");
}

/* ===============================
   WHATSAPP
=================================*/
function enviarWhatsapp() {

  const texto =
    document.getElementById("mensagemFinal").value;

  const url =
    "https://wa.me/?text=" +
    encodeURIComponent(texto);

  window.open(url, "_blank");
}