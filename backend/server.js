import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import promoProducts from "./routes/promoProducts.js";
import notificationRoutes from "./routes/notifications.js";
import stockRoutes from "./routes/stock.js";

dotenv.config();
connectDB();

const app = express();


// ===============================
// 📁 Caminhos base
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ===============================
// 🌐 CORS
// ===============================
app.use(
  cors({
    origin: [
      "https://catalogo-frontend.netlify.app",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-auth-token"
    ],
    credentials: true
  })
);


// ===============================
// 🧩 Middlewares
// ===============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===============================
// 🚀 Rotas API
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/promos", promoProducts);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stock", stockRoutes);


// ===============================
// 🔍 Teste servidor
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Servidor do Catálogo funcionando corretamente!");
});


// ===============================
// ▶️ Inicialização
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});