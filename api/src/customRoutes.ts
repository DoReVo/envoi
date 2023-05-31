import { FastifyPluginCallback } from "fastify";
import { WebhookHandler } from "./handlers/webhook.js";

const customRoutes: FastifyPluginCallback = async (app) => {
  app.route({
    method: ["GET", "POST"],
    url: "/*",
    handler: WebhookHandler,
  });
};

export default customRoutes;
