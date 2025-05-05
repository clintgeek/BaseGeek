import { Router } from 'express';
import { createClient } from 'redis';

const router = Router();

const REDIS_URL = process.env.REDIS_URL || 'redis://192.168.1.17:6380';

router.get('/status', async (req, res) => {
  const client = createClient({ url: REDIS_URL });
  try {
    await client.connect();
    const info = await client.info();
    // Parse Redis INFO response
    const lines = info.split('\n');
    const stats = {};
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) stats[key.trim()] = value.trim();
      }
    }
    await client.quit();
    res.json({
      status: 'connected',
      redisVersion: stats.redis_version,
      uptime: stats.uptime_in_seconds,
      connectedClients: stats.connected_clients,
      usedMemory: stats.used_memory_human || stats.used_memory,
      totalKeys: stats.db0 ? stats.db0.split(',')[0].split('=')[1] : 0,
      statsRaw: stats
    });
  } catch (error) {
    if (client.isOpen) await client.quit();
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;