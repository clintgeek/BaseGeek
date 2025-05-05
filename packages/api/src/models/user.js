import mongoose from 'mongoose';

const userGeekUri = process.env.USERGEEK_MONGODB_URI || 'mongodb://datageek_admin:DataGeek_Admin_2024@192.168.1.17:27018/userGeek?authSource=admin';
const userGeekConn = mongoose.createConnection(userGeekUri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  profile: { type: Object, default: {} },
}, {
  timestamps: true
});

const User = userGeekConn.models.User || userGeekConn.model('User', userSchema);
export default User;