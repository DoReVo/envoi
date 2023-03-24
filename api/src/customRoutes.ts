import { FastifyPluginCallback } from "fastify";
import { WebhookHandler, WebhookPreHandler } from "./handlers/webhook.js";

const customRoutes: FastifyPluginCallback = async (app) => {
  app.route({
    method: ["GET", "POST"],
    url: "/*",
    preHandler: WebhookPreHandler,
    handler: WebhookHandler,
  });
};

export default customRoutes;
