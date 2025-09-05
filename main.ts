import * as dotenv from 'dotenv';
dotenv.config();
import http from './src/transport/http/index';
import ws from './src/transport/ws/index';
import bus from './src/transport/bus/index';
import storage from './src/storage/main/index';
import logger from './src/application/logger/index';

const main = async () => {
  await storage.start();
  await bus.start();
  const upgrade = await ws.start();
  await http.start(upgrade);

  const stop = async (code = 0, message?: Error) => {
    await ws.stop(1000);
    await http.stop(1000);
    await bus.stop();
    await storage.stop();
    const alert = code > 0 ? 'error' : 'log';
    logger[alert]('Application stopped', { code, message });
    process.exit(code);
  };

  const error = stop.bind(null, 1);
  const exit = stop.bind(null, 0);
  process.on('uncaughtException', error);
  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);
};

main();
