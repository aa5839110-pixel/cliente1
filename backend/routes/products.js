import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "cloudinary";

import Product from "../models/Product.js";
import StockHistory from "../models/StockHistory.js";

const router = express.Router();

/* ==================================
   CLOUDINARY
================================== */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ==================================
   MULTER
================================== */
const upload = multer({
  storage: multer.memoryStorage()
});

/* ==================================
   AUTH
================================== */
function auth(req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({
      msg: "Token ausente"
    });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();

  } catch {
    return res.status(401).json({
      msg: "Token inválido"
    });
  }
}

/* ==================================
   LISTAR PRODUTOS
================================== */
router.get("/", async (req, res) => {
  try {
    const produtos = await Product.find()
      .sort({ name: 1 });

    res.json(produtos);

  } catch {
    res.status(500).json({
      msg: "Erro ao listar produtos"
    });
  }
});

/* ==================================
   TOP MAIS VENDIDOS
================================== */
router.get("/top-sales/list", async (req, res) => {
  try {
    const ranking = await Product.find()
      .sort({ salesCount: -1 })
      .limit(10);

    res.json(ranking);

  } catch {
    res.status(500).json({
      msg: "Erro ao carregar ranking"
    });
  }
});

/* ==================================
   HISTÓRICO
================================== */
router.get("/history/list", auth, async (req, res) => {
  try {
    const historico =
      await StockHistory.find()
        .sort({ date: -1 })
        .limit(50);

    res.json(historico);

  } catch {
    res.status(500).json({
      msg: "Erro ao buscar histórico"
    });
  }
});

/* ==================================
   BUSCAR PRODUTO
================================== */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    let produto;

    if (id.length === 24) {
      produto =
        await Product.findById(id);
    } else {
      produto =
        await Product.findOne({
          productId: id
        });
    }

    if (!produto) {
      return res.status(404).json({
        msg: "Produto não encontrado"
      });
    }

    res.json(produto);

  } catch {
    res.status(500).json({
      msg: "Erro ao buscar produto"
    });
  }
});

/* ==================================
   ADICIONAR PRODUTO
================================== */
router.post(
  "/",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("📦 Body recebido:", req.body);
      console.log("🖼️ File recebido:", req.file ? "Sim" : "Não");
      console.log("🔑 Usuário:", req.user);
      
      let imageUrl = "";

      if (req.file) {
        console.log("☁️ Iniciando upload para Cloudinary...");
        console.log("📋 Cloudinary config:", {
          cloud: process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "FALTANDO",
          key: process.env.CLOUDINARY_API_KEY ? "OK" : "FALTANDO",
          secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "FALTANDO"
        });
        
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
              { folder: "catalogo-produtos" },
              (error, result) => {
                if (error) {
                  console.error("❌ Erro Cloudinary:", error);
                  reject(error);
                } else {
                  console.log("✅ Upload Cloudinary OK");
                  resolve(result);
                }
              }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
          
          imageUrl = result.secure_url;
          console.log("🔗 URL da imagem:", imageUrl);
          
        } catch (cloudinaryError) {
          console.error("🔥 ERRO NO CLOUDINARY:", cloudinaryError);
          return res.status(500).json({
            msg: "Erro no upload da imagem",
            error: cloudinaryError.message
          });
        }
      }

      const estoqueInicial = Number(req.body.stock || 0);
      
      console.log("📊 Criando produto com estoque:", estoqueInicial);

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
        isPromo: req.body.isPromo === "true" || req.body.isPromo === true,
        lastStock: estoqueInicial
      });

      console.log("💾 Salvando no banco...");
      await novoProduto.save();
      console.log("✅ Produto salvo:", novoProduto._id);

      res.json({
        msg: "Produto cadastrado com sucesso",
        product: novoProduto
      });

    } catch (err) {
      console.error("🔥 ERRO GERAL:", err);
      console.error("📋 Stack:", err.stack);
      
      res.status(500).json({
        msg: "Erro ao adicionar produto",
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

/* ==================================
   EDITAR PRODUTO
================================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const produto =
      await Product.findById(
        req.params.id
      );

    if (!produto) {
      return res.status(404).json({
        msg:
          "Produto não encontrado"
      });
    }

    Object.assign(produto, req.body);

    produto.stockTotal =
      Number(
        produto.stockL1 || 0
      ) +
      Number(
        produto.stockL5 || 0
      );

    produto.stock =
      produto.stockTotal;

    await produto.save();

    res.json({
      msg:
        "Produto atualizado",
      product:
        produto
    });

  } catch {
    res.status(500).json({
      msg:
        "Erro ao atualizar produto"
    });
  }
});

/* ==================================
   UPDATE JSON MULTILOJA
================================== */
router.post(
  "/update-json",
  auth,
  async (req, res) => {

    try {
      const loja =
        String(
          req.query.loja || ""
        ).trim();

      if (
        !["1", "5"].includes(loja)
      ) {
        return res.status(400).json({
          msg:
            "Informe ?loja=1 ou ?loja=5"
        });
      }

      const updates =
        req.body;

      if (
        !Array.isArray(updates)
      ) {
        return res.status(400).json({
          msg:
            "Formato inválido"
        });
      }

      let atualizados = 0;
      let vendas = 0;
      let reposicoes = 0;

      const historicoItens =
        [];

      for (const item of updates) {
        try {
          const codigo =
            String(
              item.productId ??
              item._id ??
              item.id ??
              ""
            ).trim();

          if (!codigo)
            continue;

          const produto =
            await Product.findOne({
              productId:
                codigo
            });

          if (!produto)
            continue;

          const estoqueNovo =
            Number(
              String(
                item.stock ??
                item.estock ??
                0
              ).replace(",", ".")
            );

          const preco1 =
            Number(
              String(
                item.price1 ??
                produto.price1
              ).replace(",", ".")
            );

          const preco2 =
            Number(
              String(
                item.price2 ??
                produto.price2
              ).replace(",", ".")
            );

          let estoqueAntigo =
            0;

          if (loja === "1") {
            estoqueAntigo =
              Number(
                produto.stockL1 || 0
              );

            produto.stockL1 =
              estoqueNovo;
          }

          if (loja === "5") {
            estoqueAntigo =
              Number(
                produto.stockL5 || 0
              );

            produto.stockL5 =
              estoqueNovo;
          }

          const diferenca =
            estoqueNovo -
            estoqueAntigo;

          if (
            estoqueNovo <
            estoqueAntigo
          ) {
            const vendido =
              estoqueAntigo -
              estoqueNovo;

            produto.salesCount =
              Number(
                produto.salesCount || 0
              ) + vendido;

            produto.lastSaleDate =
              new Date();

            vendas += vendido;
          }

          if (
            estoqueNovo >
            estoqueAntigo
          ) {
            reposicoes +=
              estoqueNovo -
              estoqueAntigo;
          }

          produto.price1 =
            preco1;

          produto.price2 =
            preco2;

          produto.stockTotal =
            Number(
              produto.stockL1 || 0
            ) +
            Number(
              produto.stockL5 || 0
            );

          produto.stock =
            produto.stockTotal;

          produto.lastStock =
            produto.stockTotal;

          historicoItens.push({
            productId:
              produto.productId,
            name:
              produto.name,
            beforeStock:
              estoqueAntigo,
            afterStock:
              estoqueNovo,
            diff:
              diferenca,
            loja:
              loja
          });

          await produto.save();

          atualizados++;

        } catch (erroInterno) {
          console.log(
            erroInterno
          );
        }
      }

      await StockHistory.create({
        updatedProducts:
          atualizados,

        salesDetected:
          vendas,

        restockDetected:
          reposicoes,

        user:
          "Administrador",

        loja:
          loja,

        items:
          historicoItens
      });

      res.json({
        msg:
          `🏬 Loja ${loja} | ✅ ${atualizados} atualizados | 🛒 ${vendas} vendas | 📦 ${reposicoes} reposições`
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        msg:
          "Erro update-json"
      });
    }
  }
);

/* ==================================
   EXCLUIR
================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      msg:
        "Produto excluído"
    });

  } catch {
    res.status(500).json({
      msg:
        "Erro ao excluir"
    });
  }
});

export default router;