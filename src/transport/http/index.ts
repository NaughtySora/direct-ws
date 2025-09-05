import { createServer } from "node:http";
import { Socket } from "node:net";
import { http } from "naughty-util";
import session from "../../application/session/index";
import logger from "../../application/logger/index";
import utils from "../../utils/index";
import config from "../../config/http";

const EOL = '\r\n\r\n';
const message = (code: number) => {
  return `HTTP/1.1 ${code} ${http.CODES[code as keyof typeof http.CODES]}${EOL}`;
}
const end = (code: number, socket: Socket) => {
  socket.write(message(code));
  socket.destroy();
};

let instance: ReturnType<typeof createServer> | null = null;
let stopping = false;

export default {
  async start(upgrade: any) {
    const server = instance = createServer();
    server.on("upgrade", (req: any, socket: Socket, head: any) => {
      const headers = req.headers;
      const token = utils.http.parseToken(headers);
      if (token === undefined) return void end(401, socket);
      let id;
      try {
        id = session.verify(token);
      } catch (e) {
        logger.error('Can\'t verify jwt', e);
      }
      if (id === undefined) return void end(401, socket);
      upgrade({ req, socket, head, id });
    });
    server.listen(config.port, () => {
      logger.log(`Server running at port ${config.port}`);
    });
  },
  stop(ms = 10000) {
    return new Promise((resolve) => {
      if (instance === null || stopping) return void resolve(undefined);
      stopping = true;
      instance.closeIdleConnections();
      const stop = () => {
        if (instance === null) return;
        instance = null;
        stopping = false;
        logger.log('HTTP server stopped');
        resolve(undefined);
      };
      setTimeout(() => {
        instance?.closeAllConnections();
        stop();
      }, ms);
      instance.close(stop);
    });
  }
};
