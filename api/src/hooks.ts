import { preHandlerAsyncHookHandler } from "fastify";

export const authHook: preHandlerAsyncHookHandler = async (req, _) => {
  const header = req.headers.authorization;

  console.log("Authorization hook, header value:", header);
};
