import express from "express";
import StockCheck from "../models/StockCheck.js";

const router = express.Router();

// SALVAR CONFERÊNCIA
router.post("/", async (req, res) => {
  try {
    await StockCheck.deleteMany(); // limpa antes (opcional)

    const dados = req.body;

    await StockCheck.insertMany(dados);

    res.json({ msg: "Conferência salva!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// BUSCAR CONFERÊNCIA
router.get("/", async (req, res) => {
  try {
    const dados = await StockCheck.find();
    res.json(dados);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;