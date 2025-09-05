import { Pool, Client } from 'pg';
import config from '../../config/postgres';
import logger from '../../application/logger/index';

let instance: Pool | null = null;

export const api = {
  query(...args: Partial<Parameters<Pool['query']>>): Promise<any> {
    if (!instance) throw new Error('postgres connection pool down');
    return instance.query.apply(instance, args as any) as any;
  },
  async transaction(fn: (client: any) => Promise<any>) {
    const client = new Client(config);
    await client.connect();
    try {
      await client.query('BEGIN');
      await fn(client.query.bind(client));
      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      await client.end();
    }
  },
};

export default {
  async start() {
    if (instance !== null) throw new Error('postgres is already running');
    const pool = (instance = new Pool(config));
    pool.on('error', () => {
      logger.error('postgres connection error');
    });
    logger.log(`postgres connected on ${config.host}:${config.port}`);
  },
  async stop() {
    if (instance === null) return;
    instance.end();
    instance = null;
    logger.log('postgres connection has been winded');
  },
};
