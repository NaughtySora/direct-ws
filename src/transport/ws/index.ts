import { WebSocketServer } from "ws";
import { reflection, http, array } from "naughty-util";
import { api as bus } from "../bus";
import messageRepo from "../../storage/main/repository/message";
import logger from "../../application/logger/index";

const collator = new Intl.Collator('en', { sensitivity: 'base' });
const meta = new WeakMap();
const connections = new Map();
let instance: WebSocketServer | null = null;
let stopping = false;

const HOT_MESSAGES = 100;
const MAX_HOT_MESSAGES = 100;
const MAX_ALLOWED_MESSAGES = 200;

const connect = async ({ params }: any) => {
  const sender = params.get('id');
  const recipient = params.get('recipient');
  logger.log(`Sender ${sender} / recipient ${recipient}`);
  const chatId = [sender, recipient].sort((a, b) => collator.compare(a, b)).join(":");
  const send = await bus.poll(chatId, 0, HOT_MESSAGES);
  return {
    sender,
    recipient,
    chatId: `chat:${chatId}`,
    send: array.valid(send) ? send : null,
  };
};

const receive = async ({ message, data, }: any) => {
  let parsed = null;
  try {
    parsed = JSON.parse(message.toString());
  } catch (cause) {
    throw new Error('Wrong data format', { cause });
  }
  const payload = JSON.stringify({
    from: data.sender,
    to: data.recipient,
    message: parsed,
  });
  const chatId = data.chatId;
  await bus.store(chatId, payload);
  await bus.publish(chatId, payload);
  const messageCount = await bus.length(chatId);
  if (messageCount >= MAX_ALLOWED_MESSAGES) {
    const messages = await bus.poll(chatId, messageCount - MAX_ALLOWED_MESSAGES, -1);
    await messageRepo.save(messages);
    await bus.trim(chatId, 0, MAX_HOT_MESSAGES);
  }
};

const notify = async (message: string, topic: string) => {
  const data = JSON.parse(message);
  const connection = connections.get(data.to);
  if (connection !== undefined) {
    connection.send(JSON.stringify(data));
  }
};

export default {
  async start() {
    bus.subscribe([{ event: "chat:*", callback: notify }]);
    const wss = instance = new WebSocketServer({ noServer: true });
    wss.on("connection", async (connection: any, req: any) => {
      const url = req.url;
      if (url === undefined) return void connection.close();
      const { pathname, searchParams } = http.parseURL(url);
      const key = pathname === "/" ? "/" : pathname.substring(1);
      if (key !== "chat") return void connection.close();
      const factor = meta.get(connection);
      connections.set(factor, connection);
      searchParams.set('id', factor);
      const data = await connect({ params: searchParams });
      if (!reflection.isEmpty(data.send)) {
        connection.send(JSON.stringify(data.send));
      }
      connection.on("message", async (message: any) => {
        try {
          await receive({ params: searchParams, message, data });
        } catch (e) {
          connections.delete(factor);
          connection.close();
          logger.error({ e });
        }
      });
      connection.on("close", () => {
        connections.delete(factor);
      });
    });
    return ({ req, socket, head, id }: any) => {
      wss.handleUpgrade(req, socket, head, (ws: any) => {
        meta.set(ws, id);
        wss.emit("connection", ws, req);
      });
    };
  },
  stop(ms = 10000) {
    return new Promise((resolve) => {
      if (instance === null || stopping) return void resolve(undefined);
      stopping = true;
      const stop = () => {
        if (instance === null) return;
        instance = null;
        stopping = false;
        resolve(undefined);
        logger.log("WS server stopped");
      };
      setTimeout(stop, ms);
      instance.close(stop);
    });
  },
};
