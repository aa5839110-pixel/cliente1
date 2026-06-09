import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "cloudinary";

import Product from "../models/Product.js";
import StockHistory from "../models/StockHistory.js";

const router = express.Router();

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer (memória)
const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware
function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "Token ausente" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido" });
  }
}

// Listar produtos
router.get("/", async (req, res) => {
  try {
    const produtos = await Product.find().sort({ name: 1 });
    res.json(produtos);
  } catch {
    res.status(500).json({ msg: "Erro ao listar produtos" });
  }
});

// Top vendas
router.get("/top-sales/list", async (req, res) => {
  try {
    const ranking = await Product.find().sort({ salesCount: -1 }).limit(10);
    res.json(ranking);
  } catch {
    res.status(500).json({ msg: "Erro ao carregar ranking" });
  }
});

// Histórico
router.get("/history/list", auth, async (req, res) => {
  try {
    const historico = await StockHistory.find().sort({ date: -1 }).limit(50);
    res.json(historico);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar histórico" });
  }
});

// Buscar produto por ID ou productId
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let produto;
    if (id.length === 24) produto = await Product.findById(id);
    else produto = await Product.findOne({ productId: id });
    if (!produto) return res.status(404).json({ msg: "Produto não encontrado" });
    res.json(produto);
  } catch {
    res.status(500).json({ msg: "Erro ao buscar produto" });
  }
});

// ADICIONAR PRODUTO (com múltiplas imagens)
router.post(
  "/",
  auth,
  upload.array("images", 6),
  async (req, res) => {
    try {
      console.log("📦 Body:", req.body);
      console.log("🖼️ Files:", req.files ? `${req.files.length} arquivo(s)` : "Nenhum");

      let imageUrl = "";
      let imageGallery = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
              { folder: "catalogo-produtos" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          imageGallery.push(result.secure_url);
        }
        imageUrl = imageGallery[0];
        console.log(`✅ ${imageGallery.length} imagem(ns) enviada(s)`);
      }

      const estoqueInicial = Number(req.body.stock || 0);

      const novoProduto = new Product({
        productId: req.body.productId,
        name: req.body.name,
        description: req.body.description || "",
        category: req.body.category,
        price1: Number(req.body.price1 || 0),
        price2: Number(req.body.price2 || 0),
        stockL1: estoqueInicial,
        stockL5: 0,
        stockTotal: estoqueInicial,
        stock: estoqueInicial,
        image: imageUrl,
        images: imageGallery,
        isPromo: req.body.isPromo === "true" || req.body.isPromo === true,
        lastStock: estoqueInicial
      });

      await novoProduto.save();
      console.log("✅ Produto salvo:", novoProduto._id);

      res.json({ msg: "Produto cadastrado com sucesso", product: novoProduto });
    } catch (err) {
      console.error("🔥 Erro:", err);
      res.status(500).json({ msg: "Erro ao adicionar produto", error: err.message });
    }
  }
);

// =============================================
// EDITAR PRODUTO (COM SUPORTE A UPLOAD DE IMAGENS)
// =============================================
router.put(
  "/:id",
  auth,
  upload.array("images", 6),  // Aceita multipart/form-data com campo "images"
  async (req, res) => {
    try {
      const produto = await Product.findById(req.params.id);
      if (!produto) {
        return res.status(404).json({ msg: "Produto não encontrado" });
      }

      // Atualiza os campos de texto (se vierem no body)
      if (req.body.name !== undefined) produto.name = req.body.name;
      if (req.body.description !== undefined) produto.description = req.body.description;
      if (req.body.price1 !== undefined) produto.price1 = Number(req.body.price1);
      if (req.body.price2 !== undefined) produto.price2 = Number(req.body.price2);
      if (req.body.stock !== undefined) {
        const novoStock = Number(req.body.stock);
        produto.stockL1 = novoStock;
        produto.stockTotal = novoStock + Number(produto.stockL5 || 0);
        produto.stock = produto.stockTotal;
      }
      if (req.body.category !== undefined) produto.category = req.body.category;

      // Processa novas imagens, se houver
      if (req.files && req.files.length > 0) {
        const imageGallery = [];
        for (const file of req.files) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
              { folder: "catalogo-produtos" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          imageGallery.push(result.secure_url);
        }
        // Substitui as imagens existentes pelas novas
        produto.images = imageGallery;
        produto.image = imageGallery[0] || ""; // primeira como principal
      }

      // Recalcula campos derivados (estoque total)
      produto.stockTotal = Number(produto.stockL1 || 0) + Number(produto.stockL5 || 0);
      produto.stock = produto.stockTotal;
      produto.lastStock = produto.stockTotal;

      await produto.save();
      res.json({ msg: "Produto atualizado com sucesso", product: produto });
    } catch (err) {
      console.error("🔥 Erro ao atualizar produto:", err);
      res.status(500).json({ msg: "Erro ao atualizar produto", error: err.message });
    }
  }
);

// Update JSON multiloja
router.post("/update-json", auth, async (req, res) => {
  try {
    const loja = String(req.query.loja || "").trim();
    if (!["1", "5"].includes(loja)) {
      return res.status(400).json({ msg: "Informe ?loja=1 ou ?loja=5" });
    }
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ msg: "Formato inválido" });
    }
    let atualizados = 0, vendas = 0, reposicoes = 0;
    const historicoItens = [];
    for (const item of updates) {
      try {
        const codigo = String(item.productId ?? item._id ?? item.id ?? "").trim();
        if (!codigo) continue;
        const produto = await Product.findOne({ productId: codigo });
        if (!produto) continue;
        const estoqueNovo = Number(String(item.stock ?? item.estock ?? 0).replace(",", "."));
        const preco1 = Number(String(item.price1 ?? produto.price1).replace(",", "."));
        const preco2 = Number(String(item.price2 ?? produto.price2).replace(",", "."));
        let estoqueAntigo = 0;
        if (loja === "1") { estoqueAntigo = Number(produto.stockL1 || 0); produto.stockL1 = estoqueNovo; }
        if (loja === "5") { estoqueAntigo = Number(produto.stockL5 || 0); produto.stockL5 = estoqueNovo; }
        const diferenca = estoqueNovo - estoqueAntigo;
        if (estoqueNovo < estoqueAntigo) {
          const vendido = estoqueAntigo - estoqueNovo;
          produto.salesCount = Number(produto.salesCount || 0) + vendido;
          produto.lastSaleDate = new Date();
          vendas += vendido;
        }
        if (estoqueNovo > estoqueAntigo) reposicoes += estoqueNovo - estoqueAntigo;
        produto.price1 = preco1;
        produto.price2 = preco2;
        produto.stockTotal = Number(produto.stockL1 || 0) + Number(produto.stockL5 || 0);
        produto.stock = produto.stockTotal;
        produto.lastStock = produto.stockTotal;
        historicoItens.push({
          productId: produto.productId,
          name: produto.name,
          beforeStock: estoqueAntigo,
          afterStock: estoqueNovo,
          diff: diferenca,
          loja
        });
        await produto.save();
        atualizados++;
      } catch (erroInterno) { console.log(erroInterno); }
    }
    await StockHistory.create({
      updatedProducts: atualizados,
      salesDetected: vendas,
      restockDetected: reposicoes,
      user: "Administrador",
      loja,
      items: historicoItens
    });
    res.json({ msg: `🏬 Loja ${loja} | ✅ ${atualizados} atualizados | 🛒 ${vendas} vendas | 📦 ${reposicoes} reposições` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Erro update-json" });
  }
});

// Excluir produto
router.delete("/:id", auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Produto excluído" });
  } catch {
    res.status(500).json({ msg: "Erro ao excluir" });
  }
});

export default router;