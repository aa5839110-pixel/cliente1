import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// 📍 Rota de registro de usuário (apenas para criar o primeiro admin)
router.post("/register", async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Usuário já existe" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      isAdmin: isAdmin || false
    });

    await newUser.save();
    res.json({ msg: "Usuário criado com sucesso!" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 📍 Rota de login
router.post("/login", async (req, res) => {
  const { email, password, deviceId } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Senha incorreta" });

    // Primeiro aparelho que fizer login
    if (!user.deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    // Bloqueia outros aparelhos
    if (user.deviceId !== deviceId) {
      return res.status(403).json({
        msg: "Este usuário já está vinculado a outro dispositivo."
      });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;