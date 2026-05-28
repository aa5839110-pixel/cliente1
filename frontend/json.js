// ===============================
// 🔒 PROTEÇÃO
// ===============================
const token = localStorage.getItem("token");
const isAdmin = localStorage.getItem("isAdmin");

if (!token) window.location.href = "login.html";
if (isAdmin !== "true") window.location.href = "produtos.html";

// ===============================
// API
// ===============================
const API =
  "https://catalogo-h0ro.onrender.com/api/products/update-json";

// ===============================
// ELEMENTOS LOJA 1
// ===============================
const file1 = document.getElementById("jsonFile1");
const btn1 = document.getElementById("uploadBtn1");
const status1 = document.getElementById("status1");
const fill1 = document.getElementById("progressFill1");

// ===============================
// ELEMENTOS LOJA 5
// ===============================
const file5 = document.getElementById("jsonFile5");
const btn5 = document.getElementById("uploadBtn5");
const status5 = document.getElementById("status5");
const fill5 = document.getElementById("progressFill5");

// ===============================
// GERAL
// ===============================
const statusGeral =
  document.getElementById("statusGeral");

// ===============================
// EVENTOS
// ===============================
btn1.addEventListener("click", () => {
  enviarArquivo(1);
});

btn5.addEventListener("click", () => {
  enviarArquivo(5);
});

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================
async function enviarArquivo(loja) {
  const input = loja === 1 ? file1 : file5;
  const btn = loja === 1 ? btn1 : btn5;
  const status = loja === 1 ? status1 : status5;
  const fill = loja === 1 ? fill1 : fill5;

  const file = input.files[0];

  if (!file) {
    status.innerText =
      "⚠️ Selecione um arquivo JSON.";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Atualizando...";

  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const jsonData = JSON.parse(e.target.result);

      if (!Array.isArray(jsonData)) {
        status.innerText =
          "❌ JSON inválido.";
        resetar(btn, loja);
        return;
      }

      const total = jsonData.length;
      const lote = 100;
      let enviados = 0;

      atualizarBarra(fill, 0);

      status.innerText =
        "📤 Preparando envio...";

      statusGeral.innerText =
        `🏬 Atualizando Loja ${loja}...`;

      for (
        let i = 0;
        i < total;
        i += lote
      ) {
        const parte =
          jsonData.slice(i, i + lote);

        const response = await fetch(
          `${API}?loja=${loja}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "x-auth-token": token
            },
            body: JSON.stringify(parte)
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          status.innerText =
            data.msg ||
            "Erro ao atualizar.";
          resetar(btn, loja);
          return;
        }

        enviados += parte.length;

        const porcentagem =
          Math.round(
            (enviados / total) * 100
          );

        atualizarBarra(
          fill,
          porcentagem
        );

        status.innerText =
          `⏳ ${porcentagem}% (${enviados}/${total})`;
      }

      atualizarBarra(fill, 100);

      status.innerText =
        `✅ Loja ${loja} atualizada com sucesso`;

      statusGeral.innerText =
        `✅ Loja ${loja} finalizada`;

    } catch (error) {
      console.log(error);

      status.innerText =
        "❌ Arquivo inválido.";
    }

    resetar(btn, loja);
  };

  reader.readAsText(file);
}

// ===============================
// BARRA
// ===============================
function atualizarBarra(fill, valor) {
  fill.style.width = valor + "%";
  fill.innerText = valor + "%";
}

// ===============================
// RESETAR BOTÃO
// ===============================
function resetar(btn, loja) {
  btn.disabled = false;
  btn.innerText =
    `📤 Atualizar Loja ${loja}`;
}