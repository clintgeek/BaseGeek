// Test script to check production AI database connection
import mongoose from 'mongoose';

async function testProductionAI() {
  try {
    // Use the same connection string as production
    const AIGEEK_MONGODB_URI = process.env.AIGEEK_MONGODB_URI || 'mongodb://datageek_admin:DataGeek_Admin_2024@192.168.1.17:27018/aiGeek?authSource=admin';

    console.log('🔗 Connecting to:', AIGEEK_MONGODB_URI);
    await mongoose.connect(AIGEEK_MONGODB_URI);
    console.log('✅ Connected to aiGeek database');

    // Check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Collections in aiGeek database:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Check AIConfig collection
    const AIConfig = mongoose.model('AIConfig', new mongoose.Schema({
      provider: String,
      apiKey: String,
      enabled: Boolean
    }));

    const configs = await AIConfig.find({});
    console.log('\n🔑 AI Configurations found:', configs.length);
    configs.forEach(config => {
      console.log(`  ${config.provider}: ${config.enabled ? '✅ Enabled' : '❌ Disabled'} - API Key: ${config.apiKey ? 'Set' : 'Not Set'}`);
    });

    // Check AIModel collection
    const AIModel = mongoose.model('AIModel', new mongoose.Schema({
      provider: String,
      modelId: String,
      name: String
    }));

    const models = await AIModel.find({});
    console.log('\n🤖 AI Models found:', models.length);
    models.slice(0, 5).forEach(model => {
      console.log(`  ${model.provider}: ${model.name} (${model.modelId})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

testProductionAI();
