import { Router } from 'express';
import { MongoClient } from 'mongodb';

const router = Router();

// MongoDB connection details from docker-compose.yml
const MONGODB_URI = 'mongodb://datageek_user:DataGeek_User_2024@192.168.1.17:27018/datageek?authSource=admin';
const DB_NAME = 'datageek';

router.get('/status', async (req, res) => {
  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);

    // Get server information
    const serverStatus = await db.command({ serverStatus: 1 });
    const dbStats = await db.command({ dbStats: 1 });

    res.json({
      serverInfo: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        host: serverStatus.host,
        connections: serverStatus.connections.current
      },
      dbStats: {
        collections: dbStats.collections,
        objects: dbStats.objects,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize
      }
    });
  } catch (error) {
    console.error('MongoDB Status Error:', error);
    res.status(500).json({
      message: 'Failed to fetch MongoDB status',
      error: error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

export default router;