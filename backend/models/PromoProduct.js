import mongoose from "mongoose";

const PromoProductSchema = new mongoose.Schema({
  promoId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  originalPrice: {
    type: Number,
    required: true
  },
  salePrice: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: "Promoção"
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("PromoProduct", PromoProductSchema);
