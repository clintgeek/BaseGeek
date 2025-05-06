import mongoose from 'mongoose';

const userGeekUri = process.env.USERGEEK_MONGODB_URI || 'mongodb://datageek_admin:DataGeek_Admin_2024@192.168.1.17:27018/userGeek?authSource=admin';
const userGeekConn = mongoose.createConnection(userGeekUri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return !this.email; },
    unique: true,
    trim: true,
    sparse: true
  },
  email: {
    type: String,
    required: function() { return !this.username; },
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true
  },
  passwordHash: { type: String, required: true },
  profile: { type: Object, default: {} },
}, {
  timestamps: true
});

// Add a pre-save hook to ensure at least one identifier is provided
userSchema.pre('save', function(next) {
  if (!this.username && !this.email) {
    next(new Error('Either username or email must be provided'));
  }
  next();
});

const User = userGeekConn.models.User || userGeekConn.model('User', userSchema);
export default User;