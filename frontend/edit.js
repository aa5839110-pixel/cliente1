const API_BASE = "https://catalogo-h0ro.onrender.com";

const params = new URLSearchParams(window.location.search);
const id = params.get("id"); // pega o ID do produto da URL

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const form = document.getElementById("editForm");
const voltarBtn = document.getElementById("voltar");
const deleteBtn = document.getElementById("delete");

// === Carregar produto ===
async function carregarProduto() {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) throw new Error("Erro ao buscar produto");
    const product = await res.json();

    document.getElementById("productMongoId").value = product._id;
    document.getElementById("productId").value = product.productId;
    document.getElementById("name").value = product.name;
    document.getElementById("description").value = product.description;
    document.getElementById("price1").value = product.price1;
    document.getElementById("price2").value = product.price2;
    document.getElementById("stock").value = product.stock;
    document.getElementById("category").value = product.category;
    document.getElementById("image").value = product.image;

    // ✅ Novo campo: produto em promoção
    const promoSelect = document.getElementById("isPromo");
    if (promoSelect) {
      promoSelect.value = product.isPromo ? "true" : "false";
    }
  } catch (err) {
    alert("Erro ao carregar o produto.");
    console.error(err);
  }
}

// === Salvar alterações ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const produtoAtualizado = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price1: parseFloat(document.getElementById("price1").value),
    price2: parseFloat(document.getElementById("price2").value),
    stock: parseInt(document.getElementById("stock").value),
    category: document.getElementById("category").value,
    image: document.getElementById("image").value,
    isPromo: document.getElementById("isPromo")?.value === "true" // ✅ Novo campo
  };

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token
      },
      body: JSON.stringify(produtoAtualizado)
    });

    if (res.ok) {
      alert("✅ Produto atualizado com sucesso!");
      window.location.href = "admin.html";
    } else {
      const data = await res.json();
      alert(data.msg || "Erro ao atualizar produto.");
    }
  } catch (err) {
    alert("Erro ao conectar com o servidor.");
    console.error(err);
  }
});

// === Excluir produto ===
deleteBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!confirm("Deseja realmente excluir este produto?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: { "x-auth-token": token }
    });

    if (res.ok) {
      alert("🗑️ Produto excluído com sucesso!");
      window.location.href = "admin.html";
    } else {
      alert("Erro ao excluir produto.");
    }
  } catch (err) {
    alert("Erro ao excluir produto.");
    console.error(err);
  }
});

// === Botão voltar ===
voltarBtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});

// === Inicialização ===
carregarProduto();