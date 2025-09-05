'use strict';

const fs = require('node:fs');

const PUBLIC_KEY_ENDPOINT = process.env.PUBLIC_API_KEY;
if (typeof PUBLIC_KEY_ENDPOINT !== "string" || PUBLIC_KEY_ENDPOINT.length === 0) {
  throw new Error('Wrong public key api');
}

(async () => {
  try {
    console.log(PUBLIC_KEY_ENDPOINT)
    const res = await fetch(PUBLIC_KEY_ENDPOINT);
    const key = await res.text();
    fs.writeFileSync('./public.pem', key, { flag: "w" });
  } catch (cause) {
    console.error(new Error("Can't get session public key", { cause }));
  }
})();
