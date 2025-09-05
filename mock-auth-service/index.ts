import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { date, http } from 'naughty-util';

/**
 * openssl genrsa -out private.pem 2048
 * openssl rsa -in private.pem -pubout -out public.pem
 */
const privateKey = fs.readFileSync(path.resolve(__dirname, './keys/private.pem'));
const publicKey = fs.readFileSync(path.resolve(__dirname, './keys/public.pem'));

const token = {
  issue(payload: Parameters<typeof jwt.sign>[0]) {
    return jwt.sign({ payload }, privateKey, { algorithm: 'RS256', expiresIn: date.HOUR });
  },
};

const routing = {
  'get:issue'(params: URLSearchParams) {
    const id = params.get('id');
    if (!id) throw new Error('No user id');
    return token.issue(id);
  },
  'get:public-key'() {
    return publicKey;
  },
};

const PORT = parseInt(process.env.AUTH_PORT as string, 10);
const server = createServer((req, res) => {
  const { url, method } = req;
  if (typeof method !== 'string' || typeof url !== 'string') {
    res.writeHead(400);
    return void res.end('Bad Request');
  }
  try {
    const { searchParams, pathname } = http.parseURL(url);
    const key = `${method.toLowerCase()}:${pathname.substring(1)}` as keyof typeof routing;
    const callback = routing[key];
    if (callback === undefined) throw new Error('Wrong endpoint');
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(callback(searchParams));
  } catch (e) {
    console.error(e);
    res.writeHead(400, { 'content-type': 'text/plain' });
    return void res.end('Bad Request');
  }
});

server.listen(PORT, () => {
  console.log(`Auth service running on ${PORT}`);
});
