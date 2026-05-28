import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  beforeStock: Number,
  afterStock: Number,
  diff: Number
});

const StockHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },

  updatedProducts: Number,

  salesDetected: Number,

  restockDetected: Number,

  user: {
    type: String,
    default: "Admin"
  },

  items: [ItemSchema]
});

export default mongoose.model("StockHistory", StockHistorySchema);