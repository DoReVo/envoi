import { RouteHandlerMethod } from "fastify";
import { DateTime } from "luxon";
import { FORWARD_WEBHOOK_JOB_NAME } from "../queue/index.js";
import { stripSlashPrefix } from "../utility/strip-slash-prefix.js";
import { nanoid } from "nanoid";
import type { Websockets } from "common";

export const WebhookHandler: RouteHandlerMethod = async (req, res) => {
  const url = new URL(`${req?.server?.env?.DOMAIN}${req?.url}`);
  // Strip /webhook
  let path = url.pathname.match(/(?<prefix>\/webhook\/)(?<path>.+)/m)?.groups
    ?.path;

  if (!path) throw new Error("No path match");

  path = stripSlashPrefix(path);

  const { prisma } = req.server;

  const routeData = await prisma.route.findFirst({
    where: {
      path,
    },
  });

  if (!routeData)
    return res
      .status(404)
      .send({ error: { message: `Path ${path} not found` } });

  const dataToSave = {
    id: nanoid(8),
    method: req.method,
    header: req.headers ?? {},
    body: (req.body as any) ?? {},
    queryString: (req.query as any) ?? {},
    routeId: routeData.id,
    timestamp: DateTime.now().toJSDate(),
  };

  // Save event in DB
  const event = await prisma.event.create({
    data: dataToSave,
  });

  if (routeData?.targets) {
    for (const target of routeData?.targets as { value: string }[]) {
      await req.server.queue.forwardWebhookQ.add(FORWARD_WEBHOOK_JOB_NAME, {
        target,
        data: event,
      });
    }
  }

  // Notify connected clients
  req.server.websocketServer.clients.forEach((c) => {
    const socketEvent: Websockets.NewRouteEvent = {
      type: "new-route-event",
      data: event,
    };
    c.send(JSON.stringify(socketEvent));
  });

  return { message: "ok" };
};
