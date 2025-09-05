import { createClient, RedisArgument } from 'redis';
import logger from '../../application/logger/index';
import config from '../../config/redis';
import { async } from 'naughty-util';

let connections = {
  sub: null,
  pub: null,
  store: null,
} as Record<string, ReturnType<typeof createClient> | null>;

let stopping = false;

export default {
  async start() {
    const url = `redis://${config.host}:${config.port}`;
    const sub = createClient({ url });
    const pub = createClient({ url });
    const store = createClient({ url });
    connections = { sub, pub, store };
    sub.on('error', (err: any) => void logger.error(err));
    pub.on('error', (err: any) => void logger.error(err));
    store.on('error', (err: any) => void logger.error(err));
    await Promise.all([sub.connect(), pub.connect(), store.connect()]);
    logger.log(`Redis connected on port ${config.port}`);
  },
  async stop(ms = 5000) {
    if (stopping) return;
    stopping = true;
    const cEntries = Object.entries(connections);
    await async.pause(ms);
    const promises: any[] = [];
    for (const { 1: connection } of cEntries) {
      if (connection !== null) promises.push(connection.close());
    }
    await Promise.all(promises);
    stopping = false;
    for (const { 0: key } of cEntries) connections[key] = null;
    logger.log('Redis stopped');
  },
};

export const api = {
  async publish(topic: RedisArgument, data: RedisArgument) {
    const pub = connections.pub;
    if (pub === null) {
      throw new Error("Can't publish a message bus is not running");
    }
    await pub.publish(topic, data);
  },
  subscribe(topics: any) {
    const sub = connections.sub;
    if (sub === null) {
      throw new Error("Can't subscribe bus is not running");
    }
    for (const topic of topics) {
      sub.pSubscribe(topic.event, topic.callback);
    }
  },
  async store(topic: RedisArgument, data: RedisArgument) {
    const store = connections.store;
    if (store === null) {
      throw new Error("Can't store data bus is not running");
    }
    await store.lPush(topic, data);
  },
  async length(topic: string) {
    const store = connections.store;
    if (store === null) {
      throw new Error("Can't store data bus is not running");
    }
    return await store.lLen(topic);
  },
  async poll(topic: string, offset: number, amount: number) {
    const store = connections.store;
    if (store === null) {
      throw new Error("Can't store data bus is not running");
    }
    return await store.lRange(topic, offset, amount);
  },
  async trim(topic: string, offset: number, amount: number) {
    const store = connections.store;
    if (store === null) {
      throw new Error("Can't store data bus is not running");
    }
    await store.lTrim(topic, offset, amount - 1);
  },
};
