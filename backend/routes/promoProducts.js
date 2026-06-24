import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "cloudinary";
import PromoProduct from "../models/PromoProduct.js";

const router = express.Router();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "Acesso negado: token ausente" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Token inválido" });
  }
};

// === 📋 Listar promoções ===
router.get("/", async (req, res) => {
  try {
    const promos = await PromoProduct.find();
    res.json(promos);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao listar promoções" });
  }
});

// === 🆕 Adicionar produto em promoção ===
router.post("/", auth, upload.single("image"), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ msg: "Acesso negado" });

  try {
    const { name, description, originalPrice, salePrice, category } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadStream = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "catalogo-promocoes" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      imageUrl = uploadStream.secure_url;
    }

    const newPromo = new PromoProduct({
      promoId: Date.now().toString(),
      name,
      description,
      originalPrice: parseFloat(originalPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      image: imageUrl,
      category: category || "Promoção"
    });

    await newPromo.save();
    res.json({ msg: "✅ Produto em promoção adicionado com sucesso!", promo: newPromo });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao adicionar promoção: " + err.message });
  }
});

// === ✏️ Editar produto em promoção ===
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ msg: "Acesso negado" });

  try {
    const { name, description, originalPrice, salePrice, category } = req.body;
    const updateData = {
      name,
      description,
      originalPrice: parseFloat(originalPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      category
    };

    if (req.file) {
      const uploadStream = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "catalogo-promocoes" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      updateData.image = uploadStream.secure_url;
    }

    const updated = await PromoProduct.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ msg: "Promoção não encontrada" });

    res.json({ msg: "✅ Promoção atualizada com sucesso!", promo: updated });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao editar promoção: " + err.message });
  }
});

// === 🗑️ Excluir produto em promoção ===
router.delete("/:id", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ msg: "Acesso negado" });

  try {
    const deleted = await PromoProduct.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Promoção não encontrada" });

    res.json({ msg: "🗑️ Promoção excluída com sucesso" });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao excluir promoção: " + err.message });
  }
});

export default router;
