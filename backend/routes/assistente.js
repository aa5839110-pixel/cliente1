
import express from "express";
import Product from "../models/Product.js";
import PromoProduct from "../models/PromoProduct.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const pergunta = String(req.body.pergunta || "").trim();

    if (!pergunta) {
      return res.status(400).json({
        resposta: "Digite uma pergunta para eu ajudar!"
      });
    }

    if (pergunta.length > 300) {
      return res.status(400).json({
        resposta: "Sua pergunta é muito longa. Tente resumir."
      });
    }

    const termos = pergunta
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter(termo => termo.length > 2);

    const produtos = await Product.find().limit(500).lean();

    const encontrados = produtos
      .map(produto => {
        const texto = `${produto.name || ""} ${produto.description || ""} ${produto.category || ""} ${produto.productId || ""}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const pontos = termos.reduce(
          (total, termo) => total + (texto.includes(termo) ? 1 : 0),
          0
        );

        return { produto, pontos };
      })
      .filter(item => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 5);

    const mencionaPromocao = /promocao|promocoes|oferta|ofertas|desconto|descontos/.test(
      pergunta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    let promos = [];

    if (mencionaPromocao) {
      promos = await PromoProduct.find().limit(5).lean();
    }

    const formatarPreco = valor =>
      Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

    let resposta = "";

    if (encontrados.length) {
      resposta = "Encontrei estes produtos no catálogo:\n\n";

      resposta += encontrados.map(({ produto }) =>
        `• ${produto.name}\n` +
        `  Código: ${produto.productId}\n` +
        `  Preço: ${formatarPreco(produto.price1)}\n` +
        `  Estoque registrado: ${Number(produto.stockTotal ?? produto.stock ?? 0)}`
      ).join("\n\n");
    } else {
      resposta = "Não encontrei produtos correspondentes a essa pergunta. Tente informar o nome, a categoria ou o código do produto.";
    }

    if (promos.length) {
      resposta += "\n\nPromoções cadastradas:\n\n";

      resposta += promos.map(promo =>
        `• ${promo.name}\n` +
        `  De: ${formatarPreco(promo.originalPrice)}\n` +
        `  Por: ${formatarPreco(promo.salePrice)}`
      ).join("\n\n");
    }

    res.json({ resposta });
  } catch (erro) {
    console.error("Erro no Teixeira AI:", erro);

    res.status(500).json({
      resposta: "Não consegui consultar o catálogo agora. Tente novamente."
    });
  }
});

export default router;
