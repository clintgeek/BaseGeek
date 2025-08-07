import mongoose from 'mongoose';

const aiConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['anthropic', 'groq', 'gemini', 'together'],
    unique: true
  },
  apiKey: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  model: {
    type: String,
    default: ''
  },
  maxTokens: {
    type: Number,
    default: 1000
  },
  temperature: {
    type: Number,
    default: 0.7
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
aiConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AIConfig', aiConfigSchema);
