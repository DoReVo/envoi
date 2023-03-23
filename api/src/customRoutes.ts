import { FastifyPluginCallback } from "fastify";
import { WebhookHandler, WebhookPreHandler } from "./handlers/webhook.js";

const customRoutes: FastifyPluginCallback = async (app) => {
  /* Log all route registered */
  app.addHook("onRoute", (routeOptions) => {
    app.log.info(
      "Route registered | Method: %s | Path: %s",
      routeOptions.method,
      routeOptions.path
    );
  });
  // Get all routes in redis
  const { redis } = app;

  let data = await redis.keys("envoi:url:*");
  // remove envoi
  data = data.map((key) => key.slice(6));

  const webhookPathsData = await Promise.all(
    data.map((key) => redis.hgetall(key))
  );

  // Register both GET and POST request
  for (const hook of webhookPathsData) {
    app.route({
      method: ["GET", "POST"],
      url: `/${hook?.url!}`,
      preHandler: WebhookPreHandler,
      handler: WebhookHandler,
    });
  }
};

export default customRoutes;
