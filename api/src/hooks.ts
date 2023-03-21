import { preHandlerAsyncHookHandler } from "fastify";

export const authHook: preHandlerAsyncHookHandler = async (req, res) => {
  const header = req.headers.authorization;

  console.log("Authorization hook, header value:", header);
};
