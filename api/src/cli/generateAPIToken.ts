import { randomBytes } from "crypto";

console.log(Buffer.from(randomBytes(64)).toString("base64"));
