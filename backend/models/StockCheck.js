import mongoose from "mongoose";

const StockCheckSchema = new mongoose.Schema({
  produto: String,
  codigo: String,
  estoque: Number,
  status: String, // ok ou faltando
  observacao: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("StockCheck", StockCheckSchema);