import mongoose from 'mongoose';

const aiPricingSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['anthropic', 'groq', 'gemini', 'together']
  },
  modelId: {
    type: String,
    required: true
  },
  inputPrice: {
    type: Number,
    required: true,
    default: 0
  },
  outputPrice: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  priceUnit: {
    type: String,
    default: 'per_1k_tokens'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique pricing per model
aiPricingSchema.index({ provider: 1, modelId: 1 }, { unique: true });

const AIPricing = mongoose.model('AIPricing', aiPricingSchema);

export default AIPricing;
