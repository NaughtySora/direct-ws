'use strict';

const { misc } = require('naughty-util');
/**
 * application predicate
 * chat channel establishing with 2 users as a (DM chat)
 * users can send a text message
 * when user enters the room user can see last 100 messages
 * user can scroll up and pull more previous messages
 */

/**
 *! Connection
 * connect to chat room
 * pull last 100 messages
 */

const { WebSocket } = require('node:http');
{
  (async () => {

    const SENDER = 'd42725cd-c050-44b2-9d4b-4ccb3fc107b9';
    const RECIPIENT = 'cfd1ac0c-d204-4f88-acd3-b3eddaceed45';

    const auth = {
      endpoint: `http://localhost:${parseInt(process.env.AUTH_PORT, 10)}`,
      issueToken(id) {
        return `${this.endpoint}/issue?id=${id}`;
      },
      get publicKey() {
        return `${this.endpoint}/public-key`;
      }
    };

    const tokens = await Promise.all([
      fetch(auth.issueToken(SENDER)),
      fetch(auth.issueToken(RECIPIENT)),
    ]).then(promises => {
      return Promise.all([promises[0].text(), promises[1].text()]);
    });

    const sender = tokens[0];
    const recipient = tokens[1];

    const connect = (token, to) => {
      const { promise, resolve } = Promise.withResolvers();
      const socket = new WebSocket(`ws://localhost:3000/chat?recipient=${to}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      socket.addEventListener("message", (event) => {
        console.log("Received:", event.data);
      });
      socket.addEventListener("error", (err) => {
        console.log("Error:", err);
      });
      socket.addEventListener("open", (event) => {
        console.log('Connection open');
        resolve((message, to) => {
          socket.send(JSON.stringify({ time: new Date().toISOString(), message, }));
        });
      });
      return promise;
    };

    const [s1, s2] = await Promise.all([
      connect(sender, RECIPIENT),
      connect(recipient, SENDER)
    ]);

    // setInterval(() => {
    //   s1("hi!");
    // }, misc.random(3000, 1000));

    // setInterval(() => {
    //   s2("hiii!");
    // }, misc.random(3000, 1000));
  })();
}

