import { RouteHandlerMethod } from "fastify";
import { isEmpty } from "lodash-es";
import { DateTime } from "luxon";
import { FORWARD_WEBHOOK_JOB_NAME } from "../queue/index.js";

export interface WebhookData {
  reqId: string;
  timestamp: number;
  method: string;
  headers: Headers;
  body: Body;
  queryString: QueryString;
}

interface QueryString {
  [x: string]: string;
}

interface Body {
  [x: string]: string;
}

interface Headers {
  [x: string]: string;
}

export const WebhookPreHandler: RouteHandlerMethod = async (req, res) => {
  const url = new URL(`${req?.server?.env?.DOMAIN}${req?.url}`);

  let path = url.pathname.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
    ?.path;

  if (!path) throw new Error("No path match");

  const {
    server: { redis },
  } = req;

  // Find path in redis
  let pathInDb = await redis.hgetall(`url:${path}`);

  if (isEmpty(pathInDb))
    return res.status(404).send({ error: { message: "Route not found" } });

  const key = `event_stream:url:${path}`;

  const headers = (req?.headers as Headers) ?? ({} as Headers);
  const body = (req?.body as Body) ?? ({} as Body);
  const queryString = (req?.query as Body) ?? ({} as Body);
  const method = req.method;
  const reqId = req.id as string;
  const timestamp = DateTime.now().toMillis();

  const data: WebhookData = {
    reqId,
    timestamp,
    method,
    headers,
    body,
    queryString,
  };

  pathInDb = {
    ...pathInDb,
    targets: JSON.parse(pathInDb?.targets ?? "[]"),
    tags: JSON.parse(pathInDb?.tags ?? "[]"),
  };

  // For each target url, add a job
  for (const target of pathInDb?.targets!) {
    req.log.info({ target: target?.value! }, "Adding job");
    await req.server.queue.forwardWebhookQ.add(FORWARD_WEBHOOK_JOB_NAME, {
      target,
      data,
    });
    req.log.info({ target: target?.value! }, "Job added");
  }

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
  const url = new URL(`${req?.server?.env?.DOMAIN}${req?.url}`);
  // Strip /webhook
  let path = url.pathname.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
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
