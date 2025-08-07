import mongoose from 'mongoose';

const aiFreeTierSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['anthropic', 'groq', 'gemini', 'together']
  },
  modelId: {
    type: String,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  freeLimits: {
    requestsPerMinute: { type: Number, default: 0 },
    requestsPerDay: { type: Number, default: 0 },
    tokensPerMinute: { type: Number, default: 0 },
    tokensPerDay: { type: Number, default: 0 },
    audioSecondsPerHour: { type: Number, default: 0 },
    audioSecondsPerDay: { type: Number, default: 0 }
  },
  currentUsage: {
    requestsToday: { type: Number, default: 0 },
    tokensToday: { type: Number, default: 0 },
    audioSecondsToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure unique free tier per model
aiFreeTierSchema.index({ provider: 1, modelId: 1 }, { unique: true });

const AIFreeTier = mongoose.model('AIFreeTier', aiFreeTierSchema);

export default AIFreeTier;
