import { RouteHandlerMethod } from "fastify";
import { DateTime } from "luxon";

export const WebhookPreHandler: RouteHandlerMethod = async (req, _res) => {
  // Insert to redis stream
  let path = req.routerPath.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
    ?.path;

  if (!path) throw new Error("No path match");

  const key = `stream:url:${path}`;

  const {
    server: { redis },
  } = req;

  const headers = req?.headers ?? {};
  const body = req?.body ?? {};
  const queryString = req?.query ?? {};

  const data = { headers, body, queryString };

  try {
    await redis.xadd(key, "*", "data", JSON.stringify(data));

    // Notify connected clients
    req.server.websocketServer.clients.forEach((c) => {
      const event = {
        type: "new-request",
        timestamp: DateTime.now().toMillis(),
        path,
        data,
      };
      c.send(JSON.stringify(event));
    });
  } catch (error) {
    // noop
  }
};

export const WebhookHandler: RouteHandlerMethod = async (req, _res) => {
  // Strip /webhook
  let path = req.routerPath.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
    ?.path;

  if (!path) throw new Error("No path match");

  const key = `url:${path}`;
  // Find path in DB
  let pathInDB = await req.server.redis.hgetall(key);

  pathInDB = {
    ...pathInDB,
    targets: JSON.parse(pathInDB?.targets ?? "[]"),
    tags: JSON.parse(pathInDB?.tags ?? "[]"),
  };

  return pathInDB;
};
