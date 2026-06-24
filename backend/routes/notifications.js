import express from "express";
import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";

const router = express.Router();

// 🔒 Middleware de autenticação admin
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "Acesso negado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(400).json({ msg: "Token inválido" });
  }
};

// 📬 Criar nova notificação (somente admin)
router.post("/", auth, async (req, res) => {
  if (!req.user.isAdmin)
    return res.status(403).json({ msg: "Acesso negado: apenas administradores" });

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ msg: "Mensagem obrigatória" });

    const notification = new Notification({ message });
    await notification.save();

    res.json({ msg: "📢 Notificação enviada com sucesso!", notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao criar notificação" });
  }
});

// 📜 Listar notificações (usuários comuns)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ date: -1 }).limit(10);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao carregar notificações" });
  }
});

export default router;