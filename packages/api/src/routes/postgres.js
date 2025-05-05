import { Router } from 'express';
import pkg from 'pg';
const { Client } = pkg;

const router = Router();

const POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://datageek_pg_admin:DataGeek_PG_2024@192.168.1.17:55432/datageek';

router.get('/status', async (req, res) => {
  const client = new Client({ connectionString: POSTGRES_URL });
  try {
    await client.connect();
    // Get version
    const versionResult = await client.query('SELECT version()');
    // Get uptime (in seconds)
    const uptimeResult = await client.query(`SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime FROM pg_postmaster_start_time()`);
    // Get database size
    const sizeResult = await client.query('SELECT pg_database_size(current_database()) as size');
    // Get connection count
    const connResult = await client.query('SELECT count(*) FROM pg_stat_activity');
    await client.end();
    res.json({
      status: 'connected',
      version: versionResult.rows[0].version,
      uptime: uptimeResult.rows[0].uptime,
      dbSize: sizeResult.rows[0].size,
      connectionCount: connResult.rows[0].count
    });
  } catch (error) {
    if (client) await client.end();
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;