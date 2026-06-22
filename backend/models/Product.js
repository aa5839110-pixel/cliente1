import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  obs: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  price1: {
    type: Number,
    required: true
  },
  price2: {
    type: Number,
    required: true
  },
  stockL3: {
    type: Number,
    default: 0
  },
  stockL10: {
    type: Number,
    default: 0
  },
  stockTotal: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  images: {
    type: [String],
    default: []
  },
  isPromo: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0
  },
  lastStock: {
    type: Number,
    default: 0
  },
  lastSaleDate: {
    type: Date,
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
});

/* =========================
   ANTES DE SALVAR (CORRIGIDO)
========================= */
ProductSchema.pre("save", function (next) {
  // Versão antiga do Mongoose
  if (typeof next === 'function') {
    this.stockTotal = Number(this.stockL3 || 0) + Number(this.stockL10 || 0);
    this.stock = this.stockTotal;
    return next();
  }
  
  // Versão nova do Mongoose (sem next)
  this.stockTotal = Number(this.stockL3 || 0) + Number(this.stockL10 || 0);
  this.stock = this.stockTotal;
});

export default mongoose.model("Product", ProductSchema);