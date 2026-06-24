const API_BASE = "https://catalogo-h0ro.onrender.com";
const token = localStorage.getItem("token");

window.addEventListener("DOMContentLoaded", () => {
  carregarRelatorios();
});

async function carregarRelatorios() {
  try {
    const [prodRes, histRes] = await Promise.all([
      fetch(`${API_BASE}/api/products`),
      fetch(`${API_BASE}/api/products/history/list`, {
        headers: { "x-auth-token": token }
      })
    ]);

    const produtos = await prodRes.json();
    const historico = await histRes.json();

    preencherCards(produtos, historico);
    graficoTop(produtos);
    graficoEstoque(produtos);
    comprarUrgente(produtos);
    historicoLista(historico);
    produtosParados(produtos);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar relatórios.");
  }
}

/* =========================
   CARDS
========================= */
function preencherCards(produtos, historico) {

  const vendas = produtos.reduce((a,p)=>
    a + Number(p.salesCount || 0),0);

  const zerados = produtos.filter(p=>
    Number(p.stock)<=0).length;

  const total = produtos.length;

  const reposicoes = historico.reduce((a,h)=>
    a + Number(h.restockDetected || 0),0);

  document.getElementById("totalVendas").textContent = vendas;
  document.getElementById("zerados").textContent = zerados;
  document.getElementById("reposicoes").textContent = reposicoes;
  document.getElementById("totalProdutos").textContent = total;
}

/* =========================
   TOP VENDIDOS
========================= */
function graficoTop(produtos){

  const top = [...produtos]
    .sort((a,b)=>b.salesCount-a.salesCount)
    .slice(0,10);

  new Chart(document.getElementById("graficoTop"),{
    type:"bar",
    data:{
      labels:top.map(p=>p.name),
      datasets:[{
        label:"Vendidos",
        data:top.map(p=>p.salesCount || 0),
        borderWidth:1
      }]
    },
    options:{responsive:true}
  });
}

/* =========================
   ESTOQUE
========================= */
function graficoEstoque(produtos){

  const top = [...produtos]
    .sort((a,b)=>b.stock-a.stock)
    .slice(0,10);

  new Chart(document.getElementById("graficoEstoque"),{
    type:"line",
    data:{
      labels:top.map(p=>p.name),
      datasets:[{
        label:"Estoque",
        data:top.map(p=>p.stock || 0),
        tension:.3
      }]
    },
    options:{responsive:true}
  });
}

/* =========================
   COMPRAR URGENTE
========================= */
function comprarUrgente(produtos){

  const div = document.getElementById("comprarUrgente");

  const lista = produtos
    .filter(p => Number(p.stock)<=3)
    .sort((a,b)=>a.stock-b.stock);

  div.innerHTML = lista.map(p=>{

    const vendas = Number(p.salesCount || 0);
    const sugestao = vendas > 5 ? 10 : 5;

    return `
      <div class="item-lista urgente">
        <strong>${p.name}</strong><br>
        Estoque: ${p.stock}<br>
        Comprar: +${sugestao}
      </div>
    `;
  }).join("");

  if(!lista.length){
    div.innerHTML =
    `<div class="item-lista sucesso">
      Nenhum item crítico.
    </div>`;
  }
}

/* =========================
   HISTORICO
========================= */
function historicoLista(lista){

  const div = document.getElementById("historico");

  div.innerHTML = lista.map(h=>`
    <div class="item-lista">
      📅 ${formatar(h.date)}<br>
      ✅ ${h.updatedProducts} atualizados<br>
      🛒 ${h.salesDetected} vendas<br>
      📦 ${h.restockDetected} reposições
    </div>
  `).join("");

  if(!lista.length){
    div.innerHTML =
    `<div class="item-lista alerta">
      Sem histórico.
    </div>`;
  }
}

/* =========================
   PRODUTOS PARADOS
========================= */
function produtosParados(produtos){

  const div = document.getElementById("historico");

  const parados = produtos.filter(p =>
    Number(p.salesCount || 0) === 0 &&
    Number(p.stock || 0) > 0
  ).slice(0,5);

  if(parados.length){

    div.innerHTML += `
      <div class="item-lista alerta">
        <strong>⚠ Produtos Parados:</strong><br>
        ${parados.map(p=>`${p.name} (${p.stock})`).join("<br>")}
      </div>
    `;
  }
}

/* =========================
   DATA
========================= */
function formatar(data){
  return new Date(data).toLocaleString("pt-BR");
}