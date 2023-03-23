import { RouteHandlerMethod } from "fastify";
import { isEmpty } from "lodash-es";
import { DateTime } from "luxon";

export const WebhookPreHandler: RouteHandlerMethod = async (req, res) => {
  let path = req.url.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups?.path;

  if (!path) throw new Error("No path match");

  const {
    server: { redis },
  } = req;

  // Find path in redis
  const pathInDb = await redis.hgetall(`url:${path}`);

  if (isEmpty(pathInDb))
    return res.status(404).send({ error: { message: "Route not found" } });

  const key = `stream:url:${path}`;

  const headers = req?.headers ?? {};
  const body = req?.body ?? {};
  const queryString = req?.query ?? {};
  const method = req.method;
  const reqId = req.id;
  const timestamp = DateTime.now().toMillis();

  const data = { reqId, timestamp, method, headers, body, queryString };

  try {
    // Insert into redis stream
    const entry = await redis.xadd(key, "*", "data", JSON.stringify(data));
    // Expired after 7 days
    await redis.expireat(key, DateTime.now().plus({ day: 7 }).toUnixInteger());

    // Notify connected clients
    req.server.websocketServer.clients.forEach((c) => {
      const event = {
        type: "new-request",
        streamId: entry,
        path,
        data,
      };
      c.send(JSON.stringify(event));
    });
  } catch (error) {
    // noop
    req.log.error(error);
  }
};

export const WebhookHandler: RouteHandlerMethod = async (req, _res) => {
  // Strip /webhook
  let path = req.url.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
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
