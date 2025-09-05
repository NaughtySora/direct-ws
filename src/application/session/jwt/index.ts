import jwt from "jsonwebtoken";
import fs from "node:fs";

const publicKey = fs.readFileSync("public.pem");

export default {
  verify(token: string) {
    const parsed = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    if (typeof parsed === "string") return parsed;
    return parsed.payload;
  }
}
